import { NextResponse } from 'next/server';
import { getCurrentUser, hashPassword, signToken, AUTH_COOKIE_OPTIONS } from '@/lib/auth';
import { query, fallbackStore } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { nouveau_mdp } = await request.json();
    if (!nouveau_mdp || nouveau_mdp.length < 6) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit comporter au moins 6 caractères' },
        { status: 400 }
      );
    }

    const hashed = await hashPassword(nouveau_mdp);

    try {
      await query(
        'UPDATE utilisateurs SET mot_de_passe = ?, doit_changer_mdp = 0 WHERE id_utilisateur = ?',
        [hashed, user.id_utilisateur]
      );
    } catch {
      const u = fallbackStore.utilisateurs.find((x) => x.id_utilisateur === user.id_utilisateur);
      if (u) {
        u.mot_de_passe = hashed;
        u.doit_changer_mdp = 0;
      }
    }

    const updatedSession = {
      ...user,
      doit_changer_mdp: false,
    };
    const newToken = signToken(updatedSession);

    const response = NextResponse.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès',
      user: updatedSession,
    });

    response.cookies.set({
      ...AUTH_COOKIE_OPTIONS,
      value: newToken,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erreur lors du changement de mot de passe', details: error.message },
      { status: 500 }
    );
  }
}
