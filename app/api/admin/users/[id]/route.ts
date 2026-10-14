import { NextResponse } from 'next/server';
import { query, fallbackStore } from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const id = parseInt(params.id, 10);
    const body = await request.json();
    const { actif, id_role, reset_mot_de_passe } = body;

    try {
      const updates: string[] = [];
      const queryParams: any[] = [];

      if (actif !== undefined) {
        updates.push('actif = ?');
        queryParams.push(actif ? 1 : 0);
      }
      if (id_role !== undefined) {
        updates.push('id_role = ?');
        queryParams.push(parseInt(id_role, 10));
      }
      if (reset_mot_de_passe) {
        const hashed = await hashPassword(reset_mot_de_passe);
        updates.push('mot_de_passe = ?', 'doit_changer_mdp = 1');
        queryParams.push(hashed);
      }

      if (updates.length > 0) {
        queryParams.push(id);
        await query(`UPDATE utilisateurs SET ${updates.join(', ')} WHERE id_utilisateur = ?`, queryParams);
      }
    } catch {
      const u = fallbackStore.utilisateurs.find((x) => x.id_utilisateur === id);
      if (u) {
        if (actif !== undefined) u.actif = actif ? 1 : 0;
        if (id_role !== undefined) {
          u.id_role = Number(id_role);
          u.role_code = Number(id_role) === 1 ? 'ADMIN' : 'PRO_SANTE';
        }
        if (reset_mot_de_passe) {
          u.mot_de_passe = await hashPassword(reset_mot_de_passe);
          u.doit_changer_mdp = 1;
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Utilisateur mis à jour' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
