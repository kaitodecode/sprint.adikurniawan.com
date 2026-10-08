import { Document, Page, Rect, StyleSheet, Svg, Text, View } from '@react-pdf/renderer'
import type { MonthSummary } from '@/lib/metrics'
import { formatShort, monthLabel } from '@/lib/dates'

const ACCENT = '#1d4ed8'
const s = StyleSheet.create({
  page: { padding: 40, paddingBottom: 60, fontFamily: 'Helvetica', fontSize: 10, color: '#0f172a' },
  header: { borderBottomWidth: 2, borderBottomColor: ACCENT, paddingBottom: 10, marginBottom: 18 },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: ACCENT },
  sub: { fontSize: 11, color: '#475569', marginTop: 3 },
  kpis: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  kpi: { flex: 1, borderWidth: 0.5, borderColor: '#cbd5e1', padding: 10 },
  kpiLabel: { fontSize: 8, color: '#64748b', textTransform: 'uppercase' },
  kpiValue: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginTop: 4 },
  h2: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 8, marginTop: 6 },
  th: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: ACCENT, paddingVertical: 4 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#cbd5e1', paddingVertical: 4 },
  muted: { color: '#64748b' },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: '#64748b', borderTopWidth: 0.5, borderTopColor: '#cbd5e1', paddingTop: 6 },
})

const p = (v: number | null) => (v == null ? '-' : `${Math.round(v * 100)}%`)
const h = (v: number) => `${Math.round(v * 10) / 10}`

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const W = 500, H = 140, base = 120, max = Math.max(1, ...data.map((d) => d.value))
  const bw = 60, gap = (W - data.length * bw) / (data.length + 1)
  return (
    <View style={{ marginBottom: 14 }}>
      <Svg width={W} height={H}>
        <Rect x={0} y={base} width={W} height={0.5} fill="#94a3b8" />
        {data.map((d, i) => {
          const bh = (d.value / max) * (base - 14)
          return <Rect key={d.label} x={gap + i * (bw + gap)} y={base - bh} width={bw} height={bh} fill={ACCENT} />
        })}
      </Svg>
      <View style={{ flexDirection: 'row', width: W }}>
        {data.map((d) => (
          <Text key={d.label} style={{ flex: 1, textAlign: 'center', fontSize: 9 }}>
            {d.label} · {p(d.value)}
          </Text>
        ))}
      </View>
    </View>
  )
}

export function MonthlyReport({ month, name }: { month: MonthSummary; name: string }) {
  const printed = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date())
  const kpis: [string, string][] = [
    ['Utilisasi', p(month.utilization)],
    ['Completion', p(month.completion)],
    ['Akurasi estimasi', p(month.accuracy)],
    ['Carry-over', String(month.carryOver)],
  ]
  const retros = month.sprints.filter((m) => m.sprint.retro_done || m.sprint.retro_blocked || m.sprint.retro_change)
  const total = month.byTag.reduce((a, b) => a + b.hours, 0)

  return (
    <Document title={`Laporan ${monthLabel(month.key)}`} author={name}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.title}>Laporan Sprint Bulanan</Text>
          <Text style={s.sub}>{name} · {monthLabel(month.key)}</Text>
        </View>
        <View style={s.kpis}>
          {kpis.map(([l, v]) => (
            <View key={l} style={s.kpi}>
              <Text style={s.kpiLabel}>{l}</Text>
              <Text style={s.kpiValue}>{v}</Text>
            </View>
          ))}
        </View>
        <Text style={s.h2}>Utilitas bulanan (W1-W4)</Text>
        <BarChart data={month.weekly.map((w) => ({ label: w.label, value: w.utilization }))} />
        <Text style={[s.muted, { fontSize: 8 }]}>Utilisasi = jam aktual / kapasitas. Total aktual {h(month.actual)} jam dari kapasitas {h(month.capacity)} jam.</Text>
        <Footer printed={printed} />
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.h2}>Sprint per minggu</Text>
        <View style={s.th}>
          <Text style={{ width: 60 }}>Minggu</Text>
          <Text style={{ flex: 1 }}>Goal</Text>
          <Text style={{ width: 55, textAlign: 'right' }}>Kapasitas</Text>
          <Text style={{ width: 50, textAlign: 'right' }}>Aktual</Text>
          <Text style={{ width: 60, textAlign: 'right' }}>Status</Text>
        </View>
        {month.sprints.map((m) => (
          <View key={m.sprint.id} style={s.tr} wrap={false}>
            <Text style={{ width: 60 }}>{formatShort(m.sprint.week_start)}</Text>
            <Text style={{ flex: 1, paddingRight: 6 }}>{m.sprint.goal || '-'}</Text>
            <Text style={{ width: 55, textAlign: 'right' }}>{h(m.sprint.capacity_hours)}j</Text>
            <Text style={{ width: 50, textAlign: 'right' }}>{h(m.actual)}j</Text>
            <Text style={{ width: 60, textAlign: 'right' }}>{p(m.completion)} selesai</Text>
          </View>
        ))}

        <Text style={[s.h2, { marginTop: 20 }]}>Jam per tag/klien</Text>
        <View style={s.th}>
          <Text style={{ flex: 1 }}>Tag/Klien</Text>
          <Text style={{ width: 80, textAlign: 'right' }}>Jam aktual</Text>
        </View>
        {month.byTag.map((t) => (
          <View key={t.tag} style={s.tr} wrap={false}>
            <Text style={{ flex: 1 }}>{t.tag}</Text>
            <Text style={{ width: 80, textAlign: 'right' }}>{h(t.hours)}</Text>
          </View>
        ))}
        <View style={[s.tr, { borderBottomWidth: 0 }]}>
          <Text style={{ flex: 1, fontFamily: 'Helvetica-Bold' }}>Total</Text>
          <Text style={{ width: 80, textAlign: 'right', fontFamily: 'Helvetica-Bold' }}>{h(total)}</Text>
        </View>

        {retros.length > 0 && (
          <>
            <Text style={[s.h2, { marginTop: 20 }]}>Ringkasan retro</Text>
            {retros.map((m) => (
              <View key={m.sprint.id} style={{ marginBottom: 8 }} wrap={false}>
                <Text style={{ fontFamily: 'Helvetica-Bold' }}>{formatShort(m.sprint.week_start)}</Text>
                {m.sprint.retro_done ? <Text>Selesai: {m.sprint.retro_done}</Text> : null}
                {m.sprint.retro_blocked ? <Text>Hambatan: {m.sprint.retro_blocked}</Text> : null}
                {m.sprint.retro_change ? <Text>Perubahan: {m.sprint.retro_change}</Text> : null}
              </View>
            ))}
          </>
        )}
        <Footer printed={printed} />
      </Page>
    </Document>
  )
}

function Footer({ printed }: { printed: string }) {
  return (
    <View style={s.footer} fixed>
      <Text>Dicetak {printed}</Text>
      <Text render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} / ${totalPages}`} />
    </View>
  )
}
