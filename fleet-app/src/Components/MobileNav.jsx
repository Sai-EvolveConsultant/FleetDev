const MobileNav = ({ currentView = 'dashboard', onNavigate = () => {} }) => {
	const tabs = [
		{ id: 'dashboard', icon: '◈', label: 'Dashboard' },
		{ id: 'map', icon: '◉', label: 'Live Map' },
		{ id: 'maintenance', icon: '◧', label: 'Maintenance' },
		{ id: 'reports', icon: '▦', label: 'Reports' },
		{ id: 'inventory', icon: '◫', label: 'Inventory' },
	];

	return (
		<div className="mobile-nav">
			<div className="mobile-nav-inner">
				{tabs.map((t) => (
					<div
						key={t.id}
						className={`mob-tab ${currentView === t.id ? 'active' : ''}`}
						onClick={() => onNavigate(t.id)}
						data-view={t.id}
					>
						<div className="mob-tab-icon">{t.icon}</div>
						<div className="mob-tab-label">{t.label}</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default MobileNav;

