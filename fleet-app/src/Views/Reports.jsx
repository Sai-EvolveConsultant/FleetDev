export default function Reports({ fleet = [], active = false }) {
  const totalVehicles = fleet.length
  const onRoute = fleet.filter(v => v.status === 'active').length
  const avgOdo = totalVehicles ? Math.round(fleet.reduce((sum, v) => sum + v.odo, 0) / totalVehicles / 1000) : 0
  const totalFuel = totalVehicles ? Math.round(fleet.reduce((sum, v) => sum + v.fuel, 0) / totalVehicles) : 0
  const makeCounts = fleet.reduce((acc, v) => {
    acc[v.make] = (acc[v.make] || 0) + 1
    return acc
  }, {})
  const makes = [
    { name: 'MAN', color: 'var(--accent2)' },
    { name: 'SCANIA', color: 'var(--accent)' },
    { name: 'M BENZ', color: 'var(--amber)' }
  ].map((item) => ({
    ...item,
    count: makeCounts[item.name] || 0,
    pct: totalVehicles ? Math.round((makeCounts[item.name] || 0) / totalVehicles * 100) : 0
  }))
  const circumference = 2 * Math.PI * 42
  let offset = 0
  const donutData = makes.map((item) => {
    const dash = Math.max(0, Math.round(circumference * (item.pct / 100)))
    const segment = {
      ...item,
      dash,
      offset,
    }
    offset -= dash
    return segment
  })

  return (
    <div className={`view ${active ? 'active' : ''}`} id="view-reports">
      
      {/* KPI Row */}
      <div className="report-kpis">
        <div className="kpi blue">
          <div className="kpi-label">On Route</div>
          <div className="kpi-value">{onRoute}</div>
          <div className="kpi-sub">Active dispatches</div>
        </div>
        <div className="kpi green">
          <div className="kpi-label">Avg Odometer</div>
          <div className="kpi-value">{avgOdo}K</div>
          <div className="kpi-sub">km across fleet</div>
        </div>
        <div className="kpi amber">
          <div className="kpi-label">Avg Fuel</div>
          <div className="kpi-value">{totalFuel}%</div>
          <div className="kpi-sub">Remaining average</div>
        </div>
        <div className="kpi purple">
          <div className="kpi-label">Fleet Size</div>
          <div className="kpi-value">{totalVehicles}</div>
          <div className="kpi-sub">Total vehicles</div>
        </div>
      </div>

      {/* Report Grid */}
      <div className="report-grid">

        {/* Fuel Spend Bar Chart */}
        <div className="chart-panel">
          <div className="panel-head">
            <div className="panel-title">Fuel Spend — 6 Months (R '000s)</div>
          </div>
          <div className="bar-area" id="fuel-bars">
            {fleet.slice(0,6).map((v,idx) => {
              const color = v.fuel < 20 ? 'var(--red)' : v.fuel < 40 ? 'var(--amber)' : 'var(--accent)'
              return (
                <div key={v.id || idx} className="bar-col">
                  <div className="bar-val-label">Unit {v.id}</div>
                  <div className="bar-rect" style={{height: `${v.fuel}%`, background: color}}></div>
                  <div className="bar-month">{v.fuel}%</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Donut Chart */}
        <div className="chart-panel">
          <div className="panel-head">
            <div className="panel-title">Fleet Composition by Make</div>
          </div>
          <div className="donut-area">
            <svg width="110" height="110" viewBox="0 0 110 110">
              <circle cx="55" cy="55" r="42" fill="none" stroke="#1a2840" strokeWidth="16"/>
              {donutData.map((seg) => (
                <circle
                  key={seg.name}
                  cx="55"
                  cy="55"
                  r="42"
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="16"
                  strokeDasharray={`${seg.dash} ${Math.max(0, circumference - seg.dash)}`}
                  strokeDashoffset={seg.offset}
                  transform="rotate(-90 55 55)"
                />
              ))}
              <text x="55" y="51" textAnchor="middle" fontSize="14" fontWeight="800" fill="var(--white)" fontFamily="Barlow Condensed, sans-serif">{totalVehicles}</text>
              <text x="55" y="63" textAnchor="middle" fontSize="8" fill="var(--muted)" fontFamily="Barlow, sans-serif">vehicles</text>
            </svg>
            <div className="donut-legend">
              {donutData.map((seg) => (
                <div key={seg.name} className="dl-item">
                  <div className="dl-swatch" style={{ background: seg.color }}></div>
                  {seg.name}
                  <span className="dl-pct" style={{ color: seg.color }}>{seg.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scorecard Table */}
        <div className="score-panel">
          <div className="panel-head">
            <div className="panel-title">Highest Odometer Vehicles — Replacement Watchlist</div>
            <div className="panel-action">Export report →</div>
          </div>
          <table className="score-table">
            <thead>
              <tr>
                <th>Unit</th>
                <th>Make / Model</th>
                <th>Plate</th>
                <th>Year</th>
                <th>Odometer (km)</th>
                <th>Age (yrs)</th>
                <th>Risk</th>
                <th>Utilisation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>4042</strong></td>
                <td style={{color:'var(--muted2)'}}>MAN 18.232</td>
                <td style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:'11px'}}>CF36HMZN</td>
                <td>2005</td>
                <td style={{fontFamily:"'Barlow Condensed',sans-serif",color:'var(--red)',fontWeight:'700'}}>1,108,302</td>
                <td>21</td>
                <td><span className="wo-badge wo-sched" style={{background:'rgba(255,64,96,0.12)',color:'var(--red)',borderColor:'rgba(255,64,96,0.3)'}}>High</span></td>
                <td>
                  <div className="score-bar-wrap">
                    <div className="score-bar-bg"><div className="score-bar-fill" style={{width:'78%',background:'var(--accent2)'}}></div></div>
                  </div>
                </td>
              </tr>
              <tr>
                <td><strong>4045</strong></td>
                <td style={{color:'var(--muted2)'}}>MAN 18.232</td>
                <td style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:'11px'}}>CF36SSZN</td>
                <td>2005</td>
                <td style={{fontFamily:"'Barlow Condensed',sans-serif",color:'var(--red)',fontWeight:'700'}}>1,099,733</td>
                <td>21</td>
                <td><span className="wo-badge wo-sched" style={{background:'rgba(255,64,96,0.12)',color:'var(--red)',borderColor:'rgba(255,64,96,0.3)'}}>High</span></td>
                <td>
                  <div className="score-bar-wrap">
                    <div className="score-bar-bg"><div className="score-bar-fill" style={{width:'72%',background:'var(--accent2)'}}></div></div>
                  </div>
                </td>
              </tr>
              <tr>
                <td><strong>4047</strong></td>
                <td style={{color:'var(--muted2)'}}>MAN 18.232</td>
                <td style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:'11px'}}>CF36WVZN</td>
                <td>2005</td>
                <td style={{fontFamily:"'Barlow Condensed',sans-serif",color:'var(--red)',fontWeight:'700'}}>1,139,444</td>
                <td>21</td>
                <td><span className="wo-badge wo-sched" style={{background:'rgba(255,64,96,0.12)',color:'var(--red)',borderColor:'rgba(255,64,96,0.3)'}}>High</span></td>
                <td>
                  <div className="score-bar-wrap">
                    <div className="score-bar-bg"><div className="score-bar-fill" style={{width:'85%',background:'var(--accent2)'}}></div></div>
                  </div>
                </td>
              </tr>
              <tr>
                <td><strong>3105</strong></td>
                <td style={{color:'var(--muted2)'}}>Scania F95</td>
                <td style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:'11px'}}>NDH5855</td>
                <td>2016</td>
                <td style={{fontFamily:"'Barlow Condensed',sans-serif",color:'var(--amber)',fontWeight:'700'}}>927,580</td>
                <td>10</td>
                <td><span className="wo-badge wo-prog">Medium</span></td>
                <td>
                  <div className="score-bar-wrap">
                    <div className="score-bar-bg"><div className="score-bar-fill" style={{width:'91%',background:'var(--accent)'}}></div></div>
                  </div>
                </td>
              </tr>
              <tr>
                <td><strong>3102</strong></td>
                <td style={{color:'var(--muted2)'}}>Scania F95</td>
                <td style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:'11px'}}>NDH5852</td>
                <td>2016</td>
                <td style={{fontFamily:"'Barlow Condensed',sans-serif",color:'var(--amber)',fontWeight:'700'}}>839,887</td>
                <td>10</td>
                <td><span className="wo-badge wo-prog">Medium</span></td>
                <td>
                  <div className="score-bar-wrap">
                    <div className="score-bar-bg"><div className="score-bar-fill" style={{width:'88%',background:'var(--accent)'}}></div></div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

    </div>
  )
}
