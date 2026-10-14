import { NextResponse } from 'next/server';
import { query, fallbackStore } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
    }

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

    try {
      // Vérifier commande
      const cmdRows = await query<any[]>(
        `SELECT c.*, CONCAT(u.prenom, ' ', u.nom) AS client_nom, u.email AS client_email, u.telephone AS client_telephone, u.type_profession, u.numero_rpps
         FROM commandes c
         INNER JOIN utilisateurs u ON c.id_utilisateur = u.id_utilisateur
         WHERE c.id_commande = ?`,
        [id]
      );

      if (!cmdRows || cmdRows.length === 0) {
        return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
      }

      const commande = cmdRows[0];
      if (user.role !== 'ADMIN' && commande.id_utilisateur !== user.id_utilisateur) {
        return NextResponse.json({ error: 'Accès non autorisé à cette commande' }, { status: 403 });
      }

      // Lignes de commande
      const lignes = await query<any[]>(
        `SELECT 
           lc.id_medicament,
           lc.quantite_commandee,
           lc.prix_unitaire_ht,
           lc.taux_tva,
           m.nom AS medicament_nom,
           m.image_url,
           f.raison_sociale AS laboratoire_fournisseur,
           ROUND(lc.quantite_commandee * lc.prix_unitaire_ht, 2) AS total_ligne_ht,
           ROUND(lc.quantite_commandee * lc.prix_unitaire_ht * (1 + lc.taux_tva / 100), 2) AS total_ligne_ttc
         FROM lignes_commande lc
         INNER JOIN medicaments m ON lc.id_medicament = m.id_medicament
         INNER JOIN fournisseurs f ON m.id_fournisseur = f.id_fournisseur
         WHERE lc.id_commande = ?`,
        [id]
      );

      return NextResponse.json({
        success: true,
        commande: {
          ...commande,
          lignes,
        },
      });
    } catch {
      const commande = fallbackStore.commandes.find((c) => c.id_commande === id);
      if (!commande) {
        return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
      }
      if (user.role !== 'ADMIN' && commande.id_utilisateur !== user.id_utilisateur) {
        return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
      }
      return NextResponse.json({ success: true, commande });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Action réservée aux administrateurs' }, { status: 403 });
    }

    const id = parseInt(params.id, 10);
    const { statut_commande } = await request.json();

    const allowedStatuses = ['EN_ATTENTE', 'VALIDEE', 'PREPARATION', 'EXPEDIEE', 'LIVREE', 'ANNULEE'];
    if (!allowedStatuses.includes(statut_commande)) {
      return NextResponse.json({ error: 'Statut de commande invalide' }, { status: 400 });
    }

    try {
      await query('UPDATE commandes SET statut_commande = ? WHERE id_commande = ?', [statut_commande, id]);
    } catch {
      const c = fallbackStore.commandes.find((item) => item.id_commande === id);
      if (c) c.statut_commande = statut_commande;
    }

    return NextResponse.json({ success: true, message: `Statut de la commande mis à jour : ${statut_commande}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
