import { NextResponse } from 'next/server';
import { query, fallbackStore } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    try {
      const [cmdStats]: any = await query(`
        SELECT 
          COUNT(*) as total_commandes,
          COALESCE(SUM(montant_total_ht), 0) as ca_total_ht,
          COALESCE(SUM(montant_total_ttc), 0) as ca_total_ttc
        FROM commandes
      `);

      const [medStats]: any = await query(`
        SELECT 
          COUNT(*) as total_medicaments,
          SUM(CASE WHEN statut_validation = 'EN_ATTENTE' THEN 1 ELSE 0 END) as medicaments_en_attente,
          SUM(CASE WHEN statut_validation = 'VALIDE' THEN 1 ELSE 0 END) as medicaments_valides
        FROM medicaments
      `);

      const [userStats]: any = await query(`
        SELECT COUNT(*) as total_utilisateurs FROM utilisateurs WHERE actif = 1
      `);

      const [fourStats]: any = await query(`
        SELECT COUNT(*) as total_fournisseurs FROM fournisseurs WHERE actif = 1
      `);

      return NextResponse.json({
        success: true,
        stats: {
          total_commandes: Number(cmdStats[0]?.total_commandes || 0),
          ca_total_ht: parseFloat(Number(cmdStats[0]?.ca_total_ht || 0).toFixed(2)),
          ca_total_ttc: parseFloat(Number(cmdStats[0]?.ca_total_ttc || 0).toFixed(2)),
          total_medicaments: Number(medStats[0]?.total_medicaments || 0),
          medicaments_en_attente: Number(medStats[0]?.medicaments_en_attente || 0),
          medicaments_valides: Number(medStats[0]?.medicaments_valides || 0),
          total_utilisateurs: Number(userStats[0]?.total_utilisateurs || 0),
          total_fournisseurs: Number(fourStats[0]?.total_fournisseurs || 0),
        },
      });
    } catch {
      const totalCmd = fallbackStore.commandes.length;
      const caHt = fallbackStore.commandes.reduce((acc, c) => acc + c.montant_total_ht, 0);
      const caTtc = fallbackStore.commandes.reduce((acc, c) => acc + c.montant_total_ttc, 0);
      const pendingMeds = fallbackStore.medicaments.filter((m) => m.statut_validation === 'EN_ATTENTE').length;
      const valMeds = fallbackStore.medicaments.filter((m) => m.statut_validation === 'VALIDE').length;

      return NextResponse.json({
        success: true,
        stats: {
          total_commandes: totalCmd,
          ca_total_ht: parseFloat(caHt.toFixed(2)),
          ca_total_ttc: parseFloat(caTtc.toFixed(2)),
          total_medicaments: fallbackStore.medicaments.length,
          medicaments_en_attente: pendingMeds,
          medicaments_valides: valMeds,
          total_utilisateurs: fallbackStore.utilisateurs.length,
          total_fournisseurs: fallbackStore.fournisseurs.length,
        },
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
