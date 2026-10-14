import { NextResponse } from 'next/server';
import { query, fallbackStore } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

    try {
      const sql = `
        SELECT 
          m.*,
          c.libelle AS categorie_libelle,
          f.raison_sociale AS fournisseur_nom,
          f.email_contact AS fournisseur_email,
          f.telephone AS fournisseur_telephone,
          f.ville AS fournisseur_ville
        FROM medicaments m
        INNER JOIN categories c ON m.id_categorie = c.id_categorie
        INNER JOIN fournisseurs f ON m.id_fournisseur = f.id_fournisseur
        WHERE m.id_medicament = ?
      `;
      const rows = await query<any[]>(sql, [id]);
      if (rows && rows.length > 0) {
        return NextResponse.json({ success: true, medicament: rows[0] });
      }
    } catch {
      const med = fallbackStore.medicaments.find((m) => m.id_medicament === id);
      if (med) {
        return NextResponse.json({ success: true, medicament: med });
      }
    }

    return NextResponse.json({ error: 'Médicament non trouvé' }, { status: 404 });
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
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
    }

    const id = parseInt(params.id, 10);
    const body = await request.json();
    const {
      statut_validation,
      commentaire_validation,
      prix_ht,
      quantite_stock,
      nom,
      description,
    } = body;

    // Seul un admin peut modifier le statut de validation
    if (statut_validation && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Droits insuffisants pour modérer un médicament' },
        { status: 403 }
      );
    }

    try {
      let updateFields: string[] = [];
      let updateParams: any[] = [];

      if (statut_validation) {
        updateFields.push('statut_validation = ?', 'id_admin_validateur = ?', 'date_validation = NOW()');
        updateParams.push(statut_validation, user.id_utilisateur);
      }
      if (commentaire_validation !== undefined) {
        updateFields.push('commentaire_validation = ?');
        updateParams.push(commentaire_validation);
      }
      if (prix_ht !== undefined) {
        const ht = parseFloat(prix_ht);
        const ttc = parseFloat((ht * 1.021).toFixed(2));
        updateFields.push('prix_ht = ?', 'prix_ttc = ?');
        updateParams.push(ht, ttc);
      }
      if (quantite_stock !== undefined) {
        updateFields.push('quantite_stock = ?');
        updateParams.push(parseInt(quantite_stock, 10));
      }
      if (nom) {
        updateFields.push('nom = ?');
        updateParams.push(nom);
      }
      if (description !== undefined) {
        updateFields.push('description = ?');
        updateParams.push(description);
      }

      if (updateFields.length === 0) {
        return NextResponse.json({ error: 'Aucun champ à modifier' }, { status: 400 });
      }

      updateParams.push(id);
      await query(`UPDATE medicaments SET ${updateFields.join(', ')} WHERE id_medicament = ?`, updateParams);
    } catch {
      const med = fallbackStore.medicaments.find((m) => m.id_medicament === id);
      if (!med) {
        return NextResponse.json({ error: 'Médicament non trouvé' }, { status: 404 });
      }
      if (statut_validation) med.statut_validation = statut_validation;
      if (commentaire_validation !== undefined) med.commentaire_validation = commentaire_validation;
      if (prix_ht !== undefined) {
        med.prix_ht = parseFloat(prix_ht);
        med.prix_ttc = parseFloat((med.prix_ht * 1.021).toFixed(2));
      }
      if (quantite_stock !== undefined) med.quantite_stock = parseInt(quantite_stock, 10);
      if (nom) med.nom = nom;
      if (description !== undefined) med.description = description;
    }

    return NextResponse.json({ success: true, message: 'Médicament mis à jour avec succès' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Action réservée aux administrateurs' }, { status: 403 });
    }

    const id = parseInt(params.id, 10);
    try {
      await query('DELETE FROM medicaments WHERE id_medicament = ?', [id]);
    } catch {
      const idx = fallbackStore.medicaments.findIndex((m) => m.id_medicament === id);
      if (idx !== -1) fallbackStore.medicaments.splice(idx, 1);
    }

    return NextResponse.json({ success: true, message: 'Médicament supprimé du catalogue' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
