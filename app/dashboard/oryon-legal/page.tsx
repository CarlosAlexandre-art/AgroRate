export default function OryonLegalPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '560px', width: '100%', textAlign: 'center' }}>

        <div style={{
          width: '80px', height: '80px', borderRadius: '24px',
          background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', boxShadow: '0 8px 32px rgba(21,128,61,0.25)',
          fontSize: '36px',
        }}>
          ⚖️
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          color: '#15803d', fontSize: '11px', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '6px 14px', borderRadius: '999px', marginBottom: '20px',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          Em breve
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#111827', lineHeight: 1.2, margin: '0 0 12px' }}>
          ORYON Legal
        </h1>
        <p style={{ fontSize: '17px', fontWeight: 700, color: '#15803d', margin: '0 0 16px' }}>
          Proteção Jurídica, Patrimonial e Empresarial para o Agro
        </p>
        <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.6, margin: '0 0 40px' }}>
          Uma solução jurídica integrada ao seu perfil de crédito. Regularize sua situação e aumente sua capacidade de acesso a financiamentos rurais.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '40px', textAlign: 'left' }}>
          {[
            { icon: '🏡', label: 'Regularização Rural' },
            { icon: '📄', label: 'Contratos Agrícolas' },
            { icon: '🏛️', label: 'Holding Familiar' },
            { icon: '🔒', label: 'Blindagem Patrimonial' },
            { icon: '👨‍👩‍👧', label: 'Planejamento Sucessório' },
            { icon: '💳', label: 'Recuperação de Crédito' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px',
              padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <span style={{ fontSize: '18px' }}>{s.icon}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{s.label}</span>
            </div>
          ))}
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
          borderRadius: '16px', padding: '24px',
          boxShadow: '0 8px 24px rgba(21,128,61,0.2)',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', margin: '0 0 16px' }}>
            Quer ser avisado assim que lançar?
          </p>
          <a
            href="https://wa.me/5585986027333?text=Olá!%20Quero%20saber%20mais%20sobre%20o%20ORYON%20Legal"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'white', color: '#15803d',
              fontWeight: 800, fontSize: '14px',
              padding: '12px 24px', borderRadius: '12px',
              textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            💬 Falar com nossa equipe
          </a>
        </div>

        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '24px' }}>
          ORYON Legal · Ecossistema OryonAG
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
