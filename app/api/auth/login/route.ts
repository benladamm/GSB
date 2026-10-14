import { NextResponse } from 'next/server';
import { query, fallbackStore } from '@/lib/db';
import { comparePassword, signToken, AUTH_COOKIE_OPTIONS } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, mot_de_passe } = body;

    if (!email || !mot_de_passe) {
      return NextResponse.json(
        { error: 'Email et mot de passe obligatoires' },
        { status: 400 }
      );
    }

    let user: any = null;

    try {
      const sql = `
        SELECT u.*, r.code AS role_code, r.libelle AS role_libelle
        FROM utilisateurs u
        INNER JOIN roles r ON u.id_role = r.id_role
        WHERE u.email = ? AND u.actif = 1
        LIMIT 1
      `;
      const rows = await query<any[]>(sql, [email.trim().toLowerCase()]);
      if (rows && rows.length > 0) {
        user = rows[0];
      }
    } catch {
      // Fallback si MySQL indisponible
      user = fallbackStore.utilisateurs.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.actif === 1
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Identifiants invalides ou compte inactif' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(mot_de_passe, user.mot_de_passe);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Identifiants invalides' },
        { status: 401 }
      );
    }

    const sessionPayload = {
      id_utilisateur: user.id_utilisateur,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role_code as 'ADMIN' | 'PRO_SANTE',
      type_profession: user.type_profession,
      numero_rpps: user.numero_rpps,
      doit_changer_mdp: Boolean(user.doit_changer_mdp),
    };

    const token = signToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      message: 'Connexion réussie',
      user: sessionPayload,
    });

    response.cookies.set({
      ...AUTH_COOKIE_OPTIONS,
      value: token,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erreur interne du serveur lors de la connexion', details: error.message },
      { status: 500 }
    );
  }
}
