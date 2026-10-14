import { NextResponse } from 'next/server';
import { query, fallbackStore } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const categorieId = searchParams.get('categorie');
    const fournisseurId = searchParams.get('fournisseur');
    const statut = searchParams.get('statut'); // 'VALIDE', 'EN_ATTENTE', 'REFUSE', 'ALL'

    const user = await getCurrentUser();
    const isAdmin = user?.role === 'ADMIN';

    // Par défaut, seuls les médicaments VALIDE sont visibles publiquement / aux professionnels de santé
    let targetStatut = 'VALIDE';
    if (isAdmin && statut) {
      targetStatut = statut;
    }

    try {
      let sql = `
        SELECT 
          m.*,
          c.libelle AS categorie_libelle,
          f.raison_sociale AS fournisseur_nom,
          f.ville AS fournisseur_ville
        FROM medicaments m
        INNER JOIN categories c ON m.id_categorie = c.id_categorie
        INNER JOIN fournisseurs f ON m.id_fournisseur = f.id_fournisseur
        WHERE f.actif = 1
      `;
      const params: any[] = [];

      if (!isAdmin || targetStatut !== 'ALL') {
        sql += ` AND m.statut_validation = ?`;
        params.push(targetStatut);
      }

      if (search) {
        sql += ` AND (LOWER(m.nom) LIKE ? OR LOWER(m.description) LIKE ? OR LOWER(c.libelle) LIKE ?)`;
        const s = `%${search}%`;
        params.push(s, s, s);
      }

      if (categorieId) {
        sql += ` AND m.id_categorie = ?`;
        params.push(parseInt(categorieId, 10));
      }

      if (fournisseurId) {
        sql += ` AND m.id_fournisseur = ?`;
        params.push(parseInt(fournisseurId, 10));
      }

      sql += ` ORDER BY m.nom ASC`;

      const medicaments = await query<any[]>(sql, params);
      return NextResponse.json({
        success: true,
        count: medicaments.length,
        medicaments,
      });
    } catch {
      // Fallback
      let list = [...fallbackStore.medicaments];
      if (!isAdmin || targetStatut !== 'ALL') {
        list = list.filter((m) => m.statut_validation === targetStatut);
      }
      if (search) {
        list = list.filter(
          (m) =>
            m.nom.toLowerCase().includes(search) ||
            m.description.toLowerCase().includes(search) ||
            m.categorie_libelle.toLowerCase().includes(search)
        );
      }
      if (categorieId) {
        list = list.filter((m) => m.id_categorie === parseInt(categorieId, 10));
      }
      if (fournisseurId) {
        list = list.filter((m) => m.id_fournisseur === parseInt(fournisseurId, 10));
      }

      return NextResponse.json({
        success: true,
        count: list.length,
        medicaments: list,
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
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
    }

    const body = await request.json();
    const { nom, description, image_url, prix_ht, taux_tva = 2.10, quantite_stock, id_fournisseur, id_categorie } = body;

    if (!nom || !prix_ht || !id_fournisseur || !id_categorie) {
      return NextResponse.json(
        { error: 'Nom, prix HT, fournisseur et catégorie sont obligatoires' },
        { status: 400 }
      );
    }

    const parsedPrixHt = parseFloat(prix_ht);
    const parsedTva = parseFloat(taux_tva);
    const calculatedPrixTtc = parseFloat((parsedPrixHt * (1 + parsedTva / 100)).toFixed(2));
    const stock = parseInt(quantite_stock || '0', 10);

    // Si admin, valide immédiatement, sinon EN_ATTENTE pour modération
    const statut = user.role === 'ADMIN' ? 'VALIDE' : 'EN_ATTENTE';
    const adminId = user.role === 'ADMIN' ? user.id_utilisateur : null;

    let newId = 0;
    try {
      const sql = `
        INSERT INTO medicaments (
          nom, description, image_url, prix_ht, prix_ttc, taux_tva, 
          quantite_stock, statut_validation, id_fournisseur, id_categorie, 
          id_admin_validateur, date_validation
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const res: any = await query(sql, [
        nom,
        description || '',
        image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60',
        parsedPrixHt,
        calculatedPrixTtc,
        parsedTva,
        stock,
        statut,
        id_fournisseur,
        id_categorie,
        adminId,
        user.role === 'ADMIN' ? new Date() : null,
      ]);
      newId = res.insertId;
    } catch {
      newId = fallbackStore.medicaments.length + 1;
      const cat = fallbackStore.categories.find((c) => c.id_categorie === parseInt(id_categorie, 10));
      const four = fallbackStore.fournisseurs.find((f) => f.id_fournisseur === parseInt(id_fournisseur, 10));

      fallbackStore.medicaments.push({
        id_medicament: newId,
        nom,
        description: description || '',
        image_url: image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60',
        prix_ht: parsedPrixHt,
        prix_ttc: calculatedPrixTtc,
        taux_tva: parsedTva,
        quantite_stock: stock,
        statut_validation: statut as any,
        id_fournisseur: parseInt(id_fournisseur, 10),
        fournisseur_nom: four?.raison_sociale || 'Laboratoire Partenaire',
        id_categorie: parseInt(id_categorie, 10),
        categorie_libelle: cat?.libelle || 'Général',
        commentaire_validation: user.role === 'ADMIN' ? 'Validé par l\'administrateur' : 'Soumis pour validation',
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: user.role === 'ADMIN' ? 'Médicament ajouté et validé au catalogue' : 'Médicament soumis à validation',
        id_medicament: newId,
        statut_validation: statut,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
