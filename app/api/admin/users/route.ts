import { NextResponse } from 'next/server';
import { query, fallbackStore } from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    try {
      const sql = `
        SELECT 
          u.id_utilisateur, u.nom, u.prenom, u.email, u.telephone, 
          u.adresse, u.code_postal, u.ville, u.type_profession, 
          u.numero_rpps, u.doit_changer_mdp, u.actif, u.created_at,
          r.code AS role_code, r.libelle AS role_libelle
        FROM utilisateurs u
        INNER JOIN roles r ON u.id_role = r.id_role
        ORDER BY u.created_at DESC
      `;
      const users = await query<any[]>(sql);
      return NextResponse.json({ success: true, count: users.length, users });
    } catch {
      return NextResponse.json({
        success: true,
        count: fallbackStore.utilisateurs.length,
        users: fallbackStore.utilisateurs.map(({ mot_de_passe, ...rest }) => rest),
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const body = await request.json();
    const {
      nom,
      prenom,
      email,
      mot_de_passe = 'admin123',
      telephone,
      adresse,
      code_postal,
      ville,
      type_profession,
      numero_rpps,
      id_role = 2,
    } = body;

    if (!nom || !prenom || !email) {
      return NextResponse.json({ error: 'Nom, prénom et email obligatoires' }, { status: 400 });
    }

    const hashed = await hashPassword(mot_de_passe);
    let newId = 0;

    try {
      const sql = `
        INSERT INTO utilisateurs (
          nom, prenom, email, mot_de_passe, telephone, adresse, code_postal, ville, 
          type_profession, numero_rpps, doit_changer_mdp, actif, id_role
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?)
      `;
      const res: any = await query(sql, [
        nom,
        prenom,
        email.toLowerCase(),
        hashed,
        telephone || null,
        adresse || null,
        code_postal || null,
        ville || null,
        type_profession || 'Pharmacien',
        numero_rpps || null,
        id_role,
      ]);
      newId = res.insertId;
      await query('INSERT INTO paniers (id_utilisateur) VALUES (?)', [newId]);
    } catch {
      newId = fallbackStore.utilisateurs.length + 1;
      fallbackStore.utilisateurs.push({
        id_utilisateur: newId,
        nom,
        prenom,
        email: email.toLowerCase(),
        mot_de_passe: hashed,
        telephone: telephone || '',
        adresse: adresse || '',
        code_postal: code_postal || '',
        ville: ville || '',
        type_profession: type_profession || 'Pharmacien',
        numero_rpps: numero_rpps || null,
        doit_changer_mdp: 1,
        actif: 1,
        id_role: Number(id_role),
        role_code: Number(id_role) === 1 ? 'ADMIN' : 'PRO_SANTE',
        role_libelle: Number(id_role) === 1 ? 'Administrateur GSB' : 'Professionnel de santé',
      });
      fallbackStore.paniers.push({ id_panier: fallbackStore.paniers.length + 1, id_utilisateur: newId, lignes: [] });
    }

    return NextResponse.json(
      { success: true, message: 'Utilisateur créé par l\'administrateur', id_utilisateur: newId },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
