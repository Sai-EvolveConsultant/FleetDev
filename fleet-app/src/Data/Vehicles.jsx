export const FLEET = [
	{ id:"3101", year:2016, make:"SCANIA",  model:"F95",          plate:"NDH5851",  odo:816648, status:"active",  fuel:72 },
	{ id:"118",  year:2009, make:"MAN",     model:"26.35",        plate:"NDH2929",  odo:675612, status:"active",  fuel:58 },
	{ id:"3105", year:2016, make:"SCANIA",  model:"F95",          plate:"NDH5855",  odo:927580, status:"alert",   fuel:44 },
	{ id:"119",  year:2009, make:"MAN",     model:"26.35",        plate:"NDH2931",  odo:821049, status:"idle",    fuel:11 },
	{ id:"3120", year:2021, make:"SCANIA",  model:"F250",         plate:"NDH7287",  odo:429874, status:"parked",  fuel:81 },
	{ id:"136",  year:2018, make:"MAN",     model:"26.36",        plate:"CC93KRZN", odo:266935, status:"active",  fuel:67 },
	{ id:"138",  year:2019, make:"MAN",     model:"26.36",        plate:"TRA138ZN", odo:144250, status:"active",  fuel:89 },
	{ id:"106",  year:2002, make:"M BENZ",  model:"17.29",        plate:"NDH1192",  odo:507580, status:"idle",    fuel:53 },
	{ id:"4056", year:null, make:"MAN",     model:"Lion Exp",     plate:"BX25LBZN", odo:726025, status:"active",  fuel:62 },
	{ id:"3029", year:2012, make:"SCANIA",  model:"F95",          plate:"CH24VLZN", odo:397155, status:"active",  fuel:76 },
	{ id:"134",  year:2016, make:"MAN",     model:"26.31",        plate:"NDH5987",  odo:321411, status:"parked",  fuel:90 },
	{ id:"3121", year:2021, make:"SCANIA",  model:"F250",         plate:"NDH6333",  odo:327187, status:"active",  fuel:55 },
	{ id:"4070", year:2012, make:"MAN",     model:"Lion Explorer",plate:"BJ93XGZN", odo:868520, status:"service", fuel:88 },
	{ id:"107",  year:2002, make:"M BENZ",  model:"17.29",        plate:"NDH1120",  odo:151245, status:"active",  fuel:70 },
	{ id:"4041", year:2005, make:"MAN",     model:"18.232",       plate:"CF39BVZN", odo:932959, status:"idle",    fuel:34 },
]

export const STATUS_MAP = {
	active:  { cls:'badge-active',  label:'On Route' },
	idle:    { cls:'badge-idle',    label:'Idle'     },
	service: { cls:'badge-service', label:'Service'  },
	alert:   { cls:'badge-service', label:'Alert'    },
	parked:  { cls:'badge-parked',  label:'Parked'   },
}

export const MAKE_ICONS = { "SCANIA":"🚛", "MAN":"🚛", "M BENZ":"🚛" };
export const MAKE_BG    = {
	"SCANIA":"rgba(0,229,160,0.12)",
	"MAN":   "rgba(61,158,255,0.12)",
	"M BENZ":"rgba(255,184,48,0.12)"
};

export function fmtOdo(n) {
	return n >= 1000000 ? (n/1000000).toFixed(2)+'M' : n.toLocaleString();
}
