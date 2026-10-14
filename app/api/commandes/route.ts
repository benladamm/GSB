import { NextResponse } from 'next/server';
import { query, fallbackStore } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
    }

    try {
      let sql = `
        SELECT 
          c.id_commande,
          c.numero_commande,
          c.date_commande,
          c.statut_commande,
          c.montant_total_ht,
          c.montant_total_ttc,
          c.adresse_livraison,
          c.code_postal_livraison,
          c.ville_livraison,
          c.id_utilisateur,
          CONCAT(u.prenom, ' ', u.nom) AS client_nom,
          u.email AS client_email,
          u.type_profession,
          COUNT(lc.id_medicament) AS nb_articles
        FROM commandes c
        INNER JOIN utilisateurs u ON c.id_utilisateur = u.id_utilisateur
        LEFT JOIN lignes_commande lc ON c.id_commande = lc.id_commande
      `;
      const params: any[] = [];

      if (user.role !== 'ADMIN') {
        sql += ` WHERE c.id_utilisateur = ?`;
        params.push(user.id_utilisateur);
      }

      sql += ` GROUP BY c.id_commande ORDER BY c.date_commande DESC`;

      const commandes = await query<any[]>(sql, params);
      return NextResponse.json({ success: true, count: commandes.length, commandes });
    } catch {
      // Fallback
      let list = fallbackStore.commandes;
      if (user.role !== 'ADMIN') {
        list = list.filter((c) => c.id_utilisateur === user.id_utilisateur);
      }
      return NextResponse.json({ success: true, count: list.length, commandes: list });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise pour commander' }, { status: 401 });
    }

    const body = await request.json();
    const { adresse_livraison, code_postal_livraison, ville_livraison } = body;

    if (!adresse_livraison || !code_postal_livraison || !ville_livraison) {
      return NextResponse.json(
        { error: 'Adresse de livraison complète requise (adresse, code postal, ville)' },
        { status: 400 }
      );
    }

    try {
      // Récupérer le panier actif
      const panierRows = await query<any[]>('SELECT id_panier FROM paniers WHERE id_utilisateur = ?', [user.id_utilisateur]);
      if (!panierRows || panierRows.length === 0) {
        return NextResponse.json({ error: 'Panier introuvable' }, { status: 400 });
      }
      const idPanier = panierRows[0].id_panier;

      // Récupérer les articles du panier avec prix actuels
      const lignesPanier = await query<any[]>(
        `SELECT lp.id_medicament, lp.quantite, m.nom, m.prix_ht, m.taux_tva, m.quantite_stock
         FROM lignes_panier lp
         INNER JOIN medicaments m ON lp.id_medicament = m.id_medicament
         WHERE lp.id_panier = ?`,
        [idPanier]
      );

      if (!lignesPanier || lignesPanier.length === 0) {
        return NextResponse.json({ error: 'Votre panier est vide' }, { status: 400 });
      }

      // Calculer totaux HT et TTC
      let totalHt = 0;
      let totalTtc = 0;
      for (const line of lignesPanier) {
        const lineHt = Number(line.quantite) * Number(line.prix_ht);
        const lineTtc = lineHt * (1 + Number(line.taux_tva) / 100);
        totalHt += lineHt;
        totalTtc += lineTtc;
      }

      const orderNumber = `CMD-2026-${String(Date.now()).slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;

      // Insérer l'en-tête de commande
      const insertCmdSql = `
        INSERT INTO commandes (
          numero_commande, date_commande, statut_commande, 
          montant_total_ht, montant_total_ttc, 
          adresse_livraison, code_postal_livraison, ville_livraison, 
          id_utilisateur
        )
        VALUES (?, NOW(), 'EN_ATTENTE', ?, ?, ?, ?, ?, ?)
      `;
      const cmdResult: any = await query(insertCmdSql, [
        orderNumber,
        parseFloat(totalHt.toFixed(2)),
        parseFloat(totalTtc.toFixed(2)),
        adresse_livraison,
        code_postal_livraison,
        ville_livraison,
        user.id_utilisateur,
      ]);
      const newOrderId = cmdResult.insertId;

      // Insérer chaque ligne avec prix unitaire figé et décrémenter le stock
      for (const line of lignesPanier) {
        await query(
          `INSERT INTO lignes_commande (id_commande, id_medicament, quantite_commandee, prix_unitaire_ht, taux_tva)
           VALUES (?, ?, ?, ?, ?)`,
          [newOrderId, line.id_medicament, line.quantite, line.prix_ht, line.taux_tva]
        );
        // Décrémenter stock
        await query(
          `UPDATE medicaments SET quantite_stock = GREATEST(0, quantite_stock - ?) WHERE id_medicament = ?`,
          [line.quantite, line.id_medicament]
        );
      }

      // Vider le panier
      await query('DELETE FROM lignes_panier WHERE id_panier = ?', [idPanier]);

      return NextResponse.json(
        {
          success: true,
          message: 'Commande validée et enregistrée avec succès',
          id_commande: newOrderId,
          numero_commande: orderNumber,
          montant_total_ht: parseFloat(totalHt.toFixed(2)),
          montant_total_ttc: parseFloat(totalTtc.toFixed(2)),
        },
        { status: 201 }
      );
    } catch {
      // Fallback
      const p = fallbackStore.paniers.find((x) => x.id_utilisateur === user.id_utilisateur);
      if (!p || p.lignes.length === 0) {
        return NextResponse.json({ error: 'Votre panier est vide' }, { status: 400 });
      }

      const orderNumber = `CMD-2026-${String(Date.now()).slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
      let totalHt = 0;
      let totalTtc = 0;

      const orderLines = p.lignes.map((l) => {
        const med = fallbackStore.medicaments.find((m) => m.id_medicament === l.id_medicament)!;
        const lineHt = parseFloat((l.quantite * med.prix_ht).toFixed(2));
        const lineTtc = parseFloat((lineHt * (1 + med.taux_tva / 100)).toFixed(2));
        totalHt += lineHt;
        totalTtc += lineTtc;
        med.quantite_stock = Math.max(0, med.quantite_stock - l.quantite);
        return {
          id_medicament: med.id_medicament,
          medicament_nom: med.nom,
          laboratoire_fournisseur: med.fournisseur_nom,
          quantite_commandee: l.quantite,
          prix_unitaire_ht: med.prix_ht,
          taux_tva: med.taux_tva,
          total_ligne_ht: lineHt,
          total_ligne_ttc: lineTtc,
        };
      });

      const newId = fallbackStore.commandes.length + 1;
      const newOrder = {
        id_commande: newId,
        numero_commande: orderNumber,
        date_commande: new Date().toISOString(),
        statut_commande: 'EN_ATTENTE',
        montant_total_ht: parseFloat(totalHt.toFixed(2)),
        montant_total_ttc: parseFloat(totalTtc.toFixed(2)),
        adresse_livraison,
        code_postal_livraison,
        ville_livraison,
        id_utilisateur: user.id_utilisateur,
        client_nom: `${user.prenom} ${user.nom}`,
        client_email: user.email,
        type_profession: user.type_profession || 'Pharmacien',
        lignes: orderLines,
      };

      fallbackStore.commandes.unshift(newOrder as any);
      p.lignes = [];

      return NextResponse.json(
        {
          success: true,
          message: 'Commande validée et enregistrée avec succès',
          id_commande: newId,
          numero_commande: orderNumber,
          montant_total_ht: parseFloat(totalHt.toFixed(2)),
          montant_total_ttc: parseFloat(totalTtc.toFixed(2)),
        },
        { status: 201 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
