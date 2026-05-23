const Maintenance = ({ active = false }) => {
  return (
    <div id="view-maintenance" className={`view ${active ? 'active' : ''}`}>

      <div className="maint-kpis">
        <div className="kpi red">
          <div className="kpi-label">Overdue</div>
          <div className="kpi-value">3</div>
          <div className="kpi-sub">Immediate action</div>
        </div>
        <div className="kpi amber">
          <div className="kpi-label">Due This Week</div>
          <div className="kpi-value">4</div>
          <div className="kpi-sub">Schedule now</div>
        </div>
        <div className="kpi blue">
          <div className="kpi-label">In Workshop</div>
          <div className="kpi-value">2</div>
          <div className="kpi-sub">Active work orders</div>
        </div>
        <div className="kpi green">
          <div className="kpi-label">Completed MTD</div>
          <div className="kpi-value">11</div>
          <div className="kpi-sub">This month</div>
        </div>
      </div>

      <div className="maint-cards">
        <div className="mc ov">
          <div className="mc-type">⚠ Overdue</div>
          <div className="mc-vehicle">Unit 4042 · MAN 18.232</div>
          <div className="mc-plate">CF36HMZN · 2005 · 1,108,302 km</div>
          <div className="mc-service">Engine Oil &amp; Filter Change</div>
          <div className="mc-due">15,000 km past due · Schedule immediately</div>
        </div>
        <div className="mc ov">
          <div className="mc-type">⚠ Overdue</div>
          <div className="mc-vehicle">Unit 4047 · MAN 18.232</div>
          <div className="mc-plate">CF36WVZN · 2005 · 1,139,444 km</div>
          <div className="mc-service">Brake Inspection &amp; Tyre Rotation</div>
          <div className="mc-due">3 days past due · Workshop slot available Mon</div>
        </div>
        <div className="mc ov">
          <div className="mc-type">⚠ Overdue</div>
          <div className="mc-vehicle">Unit 3102 · Scania F95</div>
          <div className="mc-plate">NDH5852 · 2016 · 839,887 km</div>
          <div className="mc-service">Air Filter &amp; Coolant Service</div>
          <div className="mc-due">7 days past due · Downtime risk</div>
        </div>
        <div className="mc du">
          <div className="mc-type">→ Due This Week</div>
          <div className="mc-vehicle">Unit 3105 · Scania F95</div>
          <div className="mc-plate">NDH5855 · 2016 · 927,580 km</div>
          <div className="mc-service">50,000 km Major Service</div>
          <div className="mc-due">Due in 2 days · Book certified workshop</div>
        </div>
        <div className="mc du">
          <div className="mc-type">→ Due This Week</div>
          <div className="mc-vehicle">Unit 119 · MAN 26.35</div>
          <div className="mc-plate">NDH2931 · 2009 · 821,049 km</div>
          <div className="mc-service">Suspension &amp; Steering Check</div>
          <div className="mc-due">Due in 4 days · 500 km overrun warning</div>
        </div>
        <div className="mc ok">
          <div className="mc-type">✓ Scheduled</div>
          <div className="mc-vehicle">Unit 3120 · Scania F250</div>
          <div className="mc-plate">NDH7287 · 2021 · 429,874 km</div>
          <div className="mc-service">Routine 40,000 km Service</div>
          <div className="mc-due">Booked Tue 19 May · Bay 1 · K. Mokoena</div>
        </div>
      </div>

      <div className="wo-wrap">
        <div className="panel-head" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="panel-title">Open Work Orders</div>
          <div className="panel-action">+ New Work Order</div>
        </div>
        <table className="wo-table">
          <thead>
            <tr>
              <th>WO #</th>
              <th>Unit</th>
              <th>Make / Model</th>
              <th>Plate</th>
              <th>Service Type</th>
              <th>Technician</th>
              <th>Est. Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px', color: 'var(--muted)' }}>WO-3041</td>
              <td><strong>3120</strong></td>
              <td style={{ color: 'var(--muted2)' }}>Scania F250</td>
              <td style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px' }}>NDH7287</td>
              <td>40,000 km Service</td>
              <td>K. Mokoena</td>
              <td style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>4.0h</td>
              <td><span className="wo-badge wo-sched">Scheduled</span></td>
            </tr>
            <tr>
              <td style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px', color: 'var(--muted)' }}>WO-3040</td>
              <td><strong>4055</strong></td>
              <td style={{ color: 'var(--muted2)' }}>MAN 18.24</td>
              <td style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px' }}>BX26FCZN</td>
              <td>Transmission Fluid Flush</td>
              <td>T. Nkosi</td>
              <td style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>1.5h</td>
              <td><span className="wo-badge wo-prog">In Progress</span></td>
            </tr>
            <tr>
              <td style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px', color: 'var(--muted)' }}>WO-3039</td>
              <td><strong>131</strong></td>
              <td style={{ color: 'var(--muted2)' }}>MAN 26.31</td>
              <td style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px' }}>CF35WTZN</td>
              <td>Windscreen Replacement</td>
              <td>T. Nkosi</td>
              <td style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>2.0h</td>
              <td><span className="wo-badge wo-prog">In Progress</span></td>
            </tr>
            <tr>
              <td style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px', color: 'var(--muted)' }}>WO-3038</td>
              <td><strong>3109</strong></td>
              <td style={{ color: 'var(--muted2)' }}>Scania F95</td>
              <td style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px' }}>NDH5040</td>
              <td>Brake Pad Replacement</td>
              <td>K. Mokoena</td>
              <td style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>2.5h</td>
              <td><span className="wo-badge wo-done">Complete</span></td>
            </tr>
            <tr>
              <td style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px', color: 'var(--muted)' }}>WO-3037</td>
              <td><strong>128</strong></td>
              <td style={{ color: 'var(--muted2)' }}>MAN 26.31</td>
              <td style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px' }}>NDH5568</td>
              <td>Annual Roadworthy Inspection</td>
              <td>External (NATIS)</td>
              <td style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>3.0h</td>
              <td><span className="wo-badge wo-done">Complete</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Maintenance
