import { NextResponse } from 'next/server';
import { query, fallbackStore } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
    }

    try {
      // S'assurer que le panier existe
      let panierRows = await query<any[]>('SELECT id_panier FROM paniers WHERE id_utilisateur = ?', [user.id_utilisateur]);
      let idPanier: number;

      if (!panierRows || panierRows.length === 0) {
        const createRes: any = await query('INSERT INTO paniers (id_utilisateur) VALUES (?)', [user.id_utilisateur]);
        idPanier = createRes.insertId;
      } else {
        idPanier = panierRows[0].id_panier;
      }

      // Récupérer les lignes du panier avec les infos du médicament et du fournisseur
      const sqlLignes = `
        SELECT 
          lp.id_panier,
          lp.id_medicament,
          lp.quantite,
          lp.date_ajout,
          m.nom AS medicament_nom,
          m.image_url,
          m.prix_ht,
          m.prix_ttc,
          m.taux_tva,
          m.quantite_stock,
          f.raison_sociale AS fournisseur_nom,
          c.libelle AS categorie_libelle,
          ROUND(lp.quantite * m.prix_ht, 2) AS total_ligne_ht,
          ROUND(lp.quantite * m.prix_ttc, 2) AS total_ligne_ttc
        FROM lignes_panier lp
        INNER JOIN medicaments m ON lp.id_medicament = m.id_medicament
        INNER JOIN fournisseurs f ON m.id_fournisseur = f.id_fournisseur
        INNER JOIN categories c ON m.id_categorie = c.id_categorie
        WHERE lp.id_panier = ?
        ORDER BY lp.date_ajout DESC
      `;
      const lignes = await query<any[]>(sqlLignes, [idPanier]);

      const totalHt = lignes.reduce((acc, l) => acc + Number(l.total_ligne_ht), 0);
      const totalTtc = lignes.reduce((acc, l) => acc + Number(l.total_ligne_ttc), 0);
      const totalArticles = lignes.reduce((acc, l) => acc + Number(l.quantite), 0);

      return NextResponse.json({
        success: true,
        id_panier: idPanier,
        total_articles: totalArticles,
        montant_total_ht: parseFloat(totalHt.toFixed(2)),
        montant_total_ttc: parseFloat(totalTtc.toFixed(2)),
        montant_tva: parseFloat((totalTtc - totalHt).toFixed(2)),
        lignes,
      });
    } catch {
      // Fallback
      let p = fallbackStore.paniers.find((x) => x.id_utilisateur === user.id_utilisateur);
      if (!p) {
        p = { id_panier: fallbackStore.paniers.length + 1, id_utilisateur: user.id_utilisateur, lignes: [] };
        fallbackStore.paniers.push(p);
      }

      const lignes = p.lignes.map((l) => {
        const med = fallbackStore.medicaments.find((m) => m.id_medicament === l.id_medicament) || {
          nom: 'Médicament',
          image_url: '',
          prix_ht: 0,
          prix_ttc: 0,
          taux_tva: 2.10,
          quantite_stock: 0,
          fournisseur_nom: 'Laboratoire',
          categorie_libelle: 'Général',
        };
        const totalHt = parseFloat((l.quantite * med.prix_ht).toFixed(2));
        const totalTtc = parseFloat((l.quantite * med.prix_ttc).toFixed(2));
        return {
          id_panier: p!.id_panier,
          id_medicament: l.id_medicament,
          quantite: l.quantite,
          medicament_nom: med.nom,
          image_url: med.image_url,
          prix_ht: med.prix_ht,
          prix_ttc: med.prix_ttc,
          taux_tva: med.taux_tva,
          quantite_stock: med.quantite_stock,
          fournisseur_nom: med.fournisseur_nom,
          categorie_libelle: med.categorie_libelle,
          total_ligne_ht: totalHt,
          total_ligne_ttc: totalTtc,
        };
      });

      const totalHt = lignes.reduce((acc, l) => acc + l.total_ligne_ht, 0);
      const totalTtc = lignes.reduce((acc, l) => acc + l.total_ligne_ttc, 0);
      const totalArticles = lignes.reduce((acc, l) => acc + l.quantite, 0);

      return NextResponse.json({
        success: true,
        id_panier: p.id_panier,
        total_articles: totalArticles,
        montant_total_ht: parseFloat(totalHt.toFixed(2)),
        montant_total_ttc: parseFloat(totalTtc.toFixed(2)),
        montant_tva: parseFloat((totalTtc - totalHt).toFixed(2)),
        lignes,
      });
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

    const { id_medicament, quantite = 1 } = await request.json();
    const qty = parseInt(quantite, 10);
    const medId = parseInt(id_medicament, 10);

    if (isNaN(medId) || isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: 'Médicament et quantité valide (>0) requis' }, { status: 400 });
    }

    try {
      // Trouver ou créer le panier
      let panierRows = await query<any[]>('SELECT id_panier FROM paniers WHERE id_utilisateur = ?', [user.id_utilisateur]);
      let idPanier: number;
      if (!panierRows || panierRows.length === 0) {
        const createRes: any = await query('INSERT INTO paniers (id_utilisateur) VALUES (?)', [user.id_utilisateur]);
        idPanier = createRes.insertId;
      } else {
        idPanier = panierRows[0].id_panier;
      }

      // Upsert dans lignes_panier
      const upsertSql = `
        INSERT INTO lignes_panier (id_panier, id_medicament, quantite)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE quantite = quantite + VALUES(quantite)
      `;
      await query(upsertSql, [idPanier, medId, qty]);
    } catch {
      let p = fallbackStore.paniers.find((x) => x.id_utilisateur === user.id_utilisateur);
      if (!p) {
        p = { id_panier: fallbackStore.paniers.length + 1, id_utilisateur: user.id_utilisateur, lignes: [] };
        fallbackStore.paniers.push(p);
      }
      const existingLine = p.lignes.find((l) => l.id_medicament === medId);
      if (existingLine) {
        existingLine.quantite += qty;
      } else {
        p.lignes.push({ id_medicament: medId, quantite: qty });
      }
    }

    return NextResponse.json({ success: true, message: 'Article ajouté au panier' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
    }

    const { id_medicament, quantite } = await request.json();
    const qty = parseInt(quantite, 10);
    const medId = parseInt(id_medicament, 10);

    try {
      const panierRows = await query<any[]>('SELECT id_panier FROM paniers WHERE id_utilisateur = ?', [user.id_utilisateur]);
      if (panierRows && panierRows.length > 0) {
        const idPanier = panierRows[0].id_panier;
        if (qty <= 0) {
          await query('DELETE FROM lignes_panier WHERE id_panier = ? AND id_medicament = ?', [idPanier, medId]);
        } else {
          await query('UPDATE lignes_panier SET quantite = ? WHERE id_panier = ? AND id_medicament = ?', [qty, idPanier, medId]);
        }
      }
    } catch {
      const p = fallbackStore.paniers.find((x) => x.id_utilisateur === user.id_utilisateur);
      if (p) {
        if (qty <= 0) {
          p.lignes = p.lignes.filter((l) => l.id_medicament !== medId);
        } else {
          const l = p.lignes.find((item) => item.id_medicament === medId);
          if (l) l.quantite = qty;
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Quantité mise à jour' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const medIdParam = searchParams.get('id_medicament');
    const clearAll = searchParams.get('clear') === 'true';

    try {
      const panierRows = await query<any[]>('SELECT id_panier FROM paniers WHERE id_utilisateur = ?', [user.id_utilisateur]);
      if (panierRows && panierRows.length > 0) {
        const idPanier = panierRows[0].id_panier;
        if (clearAll) {
          await query('DELETE FROM lignes_panier WHERE id_panier = ?', [idPanier]);
        } else if (medIdParam) {
          await query('DELETE FROM lignes_panier WHERE id_panier = ? AND id_medicament = ?', [idPanier, parseInt(medIdParam, 10)]);
        }
      }
    } catch {
      const p = fallbackStore.paniers.find((x) => x.id_utilisateur === user.id_utilisateur);
      if (p) {
        if (clearAll) {
          p.lignes = [];
        } else if (medIdParam) {
          p.lignes = p.lignes.filter((l) => l.id_medicament !== parseInt(medIdParam, 10));
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Panier mis à jour' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
