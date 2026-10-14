import { NextResponse } from 'next/server';
import { query, fallbackStore } from '@/lib/db';
import { hashPassword, signToken, AUTH_COOKIE_OPTIONS } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nom, prenom, email, mot_de_passe, telephone, adresse, code_postal, ville, type_profession, numero_rpps } = body;

    if (!nom || !prenom || !email || !mot_de_passe) {
      return NextResponse.json(
        { error: 'Nom, prénom, email et mot de passe sont obligatoires' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(mot_de_passe);
    let newUserId = 0;

    try {
      // Vérifier si l'email existe déjà
      const existing = await query<any[]>('SELECT id_utilisateur FROM utilisateurs WHERE email = ?', [email]);
      if (existing && existing.length > 0) {
        return NextResponse.json({ error: 'Cette adresse email est déjà enregistrée' }, { status: 409 });
      }

      // Rôle par défaut : 2 (PRO_SANTE)
      const insertSql = `
        INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, adresse, code_postal, ville, type_profession, numero_rpps, doit_changer_mdp, actif, id_role)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, 2)
      `;
      const result: any = await query(insertSql, [
        nom,
        prenom,
        email.toLowerCase(),
        hashedPassword,
        telephone || null,
        adresse || null,
        code_postal || null,
        ville || null,
        type_profession || 'Pharmacien',
        numero_rpps || null,
      ]);
      newUserId = result.insertId;

      // Créer un panier actif pour ce nouvel utilisateur
      await query('INSERT INTO paniers (id_utilisateur) VALUES (?)', [newUserId]);
    } catch {
      // Fallback
      newUserId = fallbackStore.utilisateurs.length + 1;
      const newUser = {
        id_utilisateur: newUserId,
        nom,
        prenom,
        email: email.toLowerCase(),
        mot_de_passe: hashedPassword,
        telephone: telephone || '',
        adresse: adresse || '',
        code_postal: code_postal || '',
        ville: ville || '',
        type_profession: type_profession || 'Pharmacien',
        numero_rpps: numero_rpps || null,
        doit_changer_mdp: 0,
        actif: 1,
        id_role: 2,
        role_code: 'PRO_SANTE',
        role_libelle: 'Professionnel de santé',
      };
      fallbackStore.utilisateurs.push(newUser);
      fallbackStore.paniers.push({ id_panier: fallbackStore.paniers.length + 1, id_utilisateur: newUserId, lignes: [] });
    }

    const sessionPayload = {
      id_utilisateur: newUserId,
      email: email.toLowerCase(),
      nom,
      prenom,
      role: 'PRO_SANTE' as const,
      type_profession: type_profession || 'Pharmacien',
      numero_rpps: numero_rpps || null,
      doit_changer_mdp: false,
    };

    const token = signToken(sessionPayload);
    const response = NextResponse.json(
      { success: true, message: 'Compte professionnel créé avec succès', user: sessionPayload },
      { status: 201 }
    );

    response.cookies.set({
      ...AUTH_COOKIE_OPTIONS,
      value: token,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erreur lors de la création du compte', details: error.message },
      { status: 500 }
    );
  }
}
