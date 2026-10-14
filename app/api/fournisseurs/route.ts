import { NextResponse } from 'next/server';
import { query, fallbackStore } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    let fournisseurs: any[] = [];
    try {
      fournisseurs = await query<any[]>('SELECT * FROM fournisseurs WHERE actif = 1 ORDER BY raison_sociale ASC');
    } catch {
      fournisseurs = fallbackStore.fournisseurs;
    }
    return NextResponse.json({ success: true, count: fournisseurs.length, fournisseurs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    // Les laboratoires partenaires peuvent postuler ou l'admin peut les enregistrer
    const body = await request.json();
    const { raison_sociale, siret, email_contact, telephone, adresse, code_postal, ville } = body;

    if (!raison_sociale || !siret || !email_contact) {
      return NextResponse.json(
        { error: 'Raison sociale, SIRET et email de contact requis' },
        { status: 400 }
      );
    }

    let newId = 0;
    try {
      const sql = `
        INSERT INTO fournisseurs (raison_sociale, siret, email_contact, telephone, adresse, code_postal, ville, actif)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `;
      const res: any = await query(sql, [
        raison_sociale,
        siret,
        email_contact,
        telephone || null,
        adresse || null,
        code_postal || null,
        ville || null,
      ]);
      newId = res.insertId;
    } catch {
      newId = fallbackStore.fournisseurs.length + 1;
      fallbackStore.fournisseurs.push({
        id_fournisseur: newId,
        raison_sociale,
        siret,
        email_contact,
        telephone: telephone || '',
        adresse: adresse || '',
        code_postal: code_postal || '',
        ville: ville || '',
        actif: 1,
      });
    }

    return NextResponse.json(
      { success: true, message: 'Laboratoire partenaire enregistré', id_fournisseur: newId },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
