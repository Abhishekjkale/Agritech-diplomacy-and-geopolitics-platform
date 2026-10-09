/**
 * Agritech Diplomacy & Geopolitics Intelligence Platform
 * Analytical Engine & Interactive Visualizations
 * Based on "The Geopolitics of Food and Fertilizer" (Prepared October 2026)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // State Management
  const AppState = {
    currentTab: 'dashboard',
    map: null,
    mapMarkers: [],
    mapLines: [],
    charts: {},
    activeScenario: 'hormuz',
    simParams: {
      stock: 45,
      cea: 12,
      fert: 15,
      origins: 2,
      solar: 30
    },
    ceaScale: 'log' // 'log' or 'linear'
  };

  // ==========================================================
  // DATASETS EXTRACTED DIRECTLY FROM THE OCTOBER 2026 REPORT
  // ==========================================================

  // FAO Food Price Index (Figure 2)
  const faoIndexData = {
    labels: ['2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
    values: [115.0, 93.0, 92.0, 98.0, 96.0, 95.0, 98.1, 125.7, 144.7, 124.7, 122.3],
    peak2022: 160.2 // Monthly peak March 2022
  };

  // USGS Macronutrient Shares (Figure 3)
  const nutrientData = {
    nitrogen: [
      { country: 'China', share: 30, color: '#ef4444' },
      { country: 'Russia', share: 10, color: '#3b82f6' },
      { country: 'India', share: 9, color: '#f59e0b' },
      { country: 'USA', share: 9, color: '#10b981' },
      { country: 'Others (Gulf, etc.)', share: 42, color: '#64748b' }
    ],
    phosphate: [
      { country: 'China', share: 43, color: '#ef4444' },
      { country: 'Morocco (OCP)', share: 14, note: '70% Global Reserves', color: '#10b981' },
      { country: 'USA', share: 9, color: '#3b82f6' },
      { country: 'Russia', share: 6, color: '#f59e0b' },
      { country: 'Others', share: 28, color: '#64748b' }
    ],
    potash: [
      { country: 'Canada', share: 33, color: '#10b981' },
      { country: 'Russia', share: 19, color: '#3b82f6' },
      { country: 'Belarus', share: 16, note: 'Sanctioned 2021', color: '#f59e0b' },
      { country: 'China', share: 14, color: '#ef4444' },
      { country: 'Others', share: 18, color: '#64748b' }
    ]
  };

  // Exposure Matrix: Figure 4
  const exposurePoints = [
    { name: 'Somalia', x: 7.8, y: 9.5, category: 'critical', desc: 'Drought, aid dependence, port fragility' },
    { name: 'Yemen', x: 8.6, y: 9.2, category: 'critical', desc: '90% staple imports, Red Sea risks, acute famine' },
    { name: 'Sudan', x: 6.1, y: 9.1, category: 'critical', desc: 'Conflict driver, IPC Phase 5 famine confirmed 2025' },
    { name: 'Mali / Niger / Burkina Faso', x: 5.1, y: 8.8, category: 'high', desc: 'Sahel desertification, imported rice/wheat' },
    { name: 'Afghanistan', x: 5.8, y: 8.2, category: 'high', desc: 'Severe water & economic crisis' },
    { name: 'Egypt', x: 9.1, y: 8.1, category: 'critical', desc: 'World #1 wheat importer (12-13 Mt), Nile tensions' },
    { name: 'Syria', x: 7.3, y: 7.5, category: 'high', desc: 'Fiscal collapse, Black Sea reliance' },
    { name: 'Pakistan', x: 4.6, y: 7.5, category: 'high', desc: 'Glacier floods, heatwaves, Middle East fertilizer' },
    { name: 'Lebanon', x: 8.1, y: 6.6, category: 'high', desc: 'Destroyed port silos 2020, financial collapse' },
    { name: 'Iraq', x: 7.0, y: 6.6, category: 'high', desc: 'Water stress, bread reliance' },
    { name: 'Bangladesh', x: 5.6, y: 6.6, category: 'medium', desc: 'Sea rise, salinization, PL-480 history' },
    { name: 'Tunisia', x: 8.3, y: 5.8, category: 'medium', desc: 'High wheat import dependence, bread subsidies' },
    { name: 'Sri Lanka', x: 5.6, y: 4.9, category: 'caution', desc: '2021 organic shock (-20% rice), recovery' },
    { name: 'GCC States', x: 9.6, y: 3.5, category: 'buffered', desc: 'Import 80%+, extreme water scarcity, but sovereign FX' }
  ];

  // CEA vs Field (Barbosa et al. 2015, Figure 6)
  const ceaComparison = {
    metrics: ['Yield (kg/m²/yr)', 'Water Used (L/kg)', 'Energy Used (kJ/kg)'],
    field: [3.9, 250, 1100],
    hydroponic: [41.0, 20, 90000]
  };

  // Map Geographical Nodes (Choke points, Importers, Exporters, Agritech Hubs)
  const mapEntities = [
    // Choke points
    {
      id: 'hormuz',
      type: 'chokepoint',
      name: 'Strait of Hormuz',
      coords: [26.56, 56.25],
      badge: 'Active Shock 2026',
      stat1: '~20% Traded N & Sulfur',
      stat2: 'Severe Choke Risk',
      desc: 'Traffic collapsed following the 28 Feb 2026 conflict. Handles ~20% of globally traded nitrogen and major sulfur feedstock for phosphate. Despite an 8 April ceasefire and Iran-Oman MoU, WTO data through early Sept 2026 shows shipments near zero.',
      transmission: 'Urea doubled to $700/tonne in March 2026. Hit India (>40% Middle East imports) and Brazil (~50% via Hormuz). Knock-on shocks in Sudan, Somalia, Ethiopia, Pakistan, Lebanon.',
      solution: 'Decouple nitrogen via regional green-ammonia, increase domestic blending plants, and apply precision soil testing (-10-20% N demand).'
    },
    {
      id: 'turkish-straits',
      type: 'chokepoint',
      name: 'Turkish Straits (Bosphorus & Dardanelles)',
      coords: [41.02, 28.97],
      badge: 'Maritime Grain Gate',
      stat1: '~30% Pre-war Wheat',
      stat2: 'Naval Lever',
      desc: 'Connects Black Sea grain (Russia & Ukraine) to the Mediterranean and Middle East. Brokered under Black Sea Grain Initiative (2022-23; 33 Mt exported) until Russian exit in July 2023.',
      transmission: 'Stranded 20M+ tonnes of grain in 2022, pushing FAO Food Price Index to an all-time peak of 160.2.',
      solution: 'Diversify import origins to at least three supplier nations (e.g., Romania, France, Argentina).'
    },
    {
      id: 'suez-bab',
      type: 'chokepoint',
      name: 'Bab el-Mandeb & Suez Canal',
      coords: [12.58, 43.33],
      badge: 'Red Sea Corridor',
      stat1: '12-15% Global Trade',
      stat2: 'Security Risk',
      desc: 'Vital link between Europe/Black Sea and Asia/East Africa. Red Sea shipping security risks since late 2023 forced rerouting around the Cape of Good Hope, inflating freight & insurance rates.',
      transmission: 'Surging shipping costs directly transmitted to staple import prices in Yemen, Sudan, and East Africa.',
      solution: 'Establish strategic regional cereal reserves (90-120 days) and regional humanitarian corridors.'
    },
    {
      id: 'panama',
      type: 'chokepoint',
      name: 'Panama Canal',
      coords: [9.08, -79.68],
      badge: 'Climate Choke Point',
      stat1: 'Key US Grain Gateway',
      stat2: 'Drought Disrupted',
      desc: '2023-24 climate-driven drought reduced freshwater reservoir levels, restricting daily vessel transits and severely delaying U.S. grain shipments to Asian markets.',
      transmission: 'Forced expensive rerouting and demonstrated how climate volatility creates physical choke points.',
      solution: 'Enhance port silo buffers and multimodal rail-to-port infrastructure.'
    },
    {
      id: 'klaipeda',
      type: 'chokepoint',
      name: 'Klaipeda & Rail Corridors',
      coords: [55.70, 21.13],
      badge: 'Potash Transit Cut',
      stat1: 'Belaruskali Channel',
      stat2: 'Sanction Severed',
      desc: 'Lithuania ended Belaruskali potash transit to Klaipeda port in 2022 following EU/US sanctions, forcing rerouting through Russian corridors.',
      transmission: 'Buyers in Brazil, India, and SE Asia absorbed price and logistics spikes with no stake in the dispute.',
      solution: 'Develop alternative potash deposits (Canada, Jordan) and organic-mineral soil blends.'
    },
    {
      id: 'beirut',
      type: 'chokepoint',
      name: 'Port of Beirut Silos',
      coords: [33.90, 35.51],
      badge: 'Infrastructure Loss',
      stat1: '85% National Storage',
      stat2: 'Destroyed 2020',
      desc: 'The catastrophic August 2020 explosion destroyed Lebanon’s primary grain silos, leaving the country with only a few weeks of staple cereal reserves.',
      transmission: 'Compounded the 2019 financial collapse, leaving Lebanon completely defenseless against the 2022 and 2026 price shocks.',
      solution: 'Decentralized modular storage and urban greenhouse hydroponics for fresh vegetables.'
    },

    // Vulnerable Importers
    {
      id: 'egypt',
      type: 'importer',
      name: 'Egypt',
      coords: [26.82, 30.80],
      badge: 'World #1 Wheat Importer',
      stat1: '12-13 Mt Wheat/Yr',
      stat2: 'High Fiscal Strain',
      desc: 'Pre-2022, 80% of wheat came from Russia & Ukraine. Subsidized bread (aish baladi) feeds tens of millions. The price surge led to sharp currency devaluations in 2022-24, emergency IMF programs, and the $35B UAE Ras El-Hekma investment.',
      transmission: 'Price spikes translate directly to government budget deficits and political stability risks (recalling 1977 bread riots).',
      solution: 'Contract farming with African partners, precision drip irrigation in the desert, and expanding buffer reserves to 120+ days.'
    },
    {
      id: 'lebanon',
      type: 'importer',
      name: 'Lebanon',
      coords: [33.85, 35.86],
      badge: 'Hyper-Vulnerable',
      stat1: 'Near 100% Import',
      stat2: 'Zero Storage Buffers',
      desc: 'Imports virtually all wheat, mostly from Ukraine. Devastated by the 2020 silo explosion, economic collapse, and recent conflict displacement compounded by 2026 fuel price spikes (Mercy Corps).',
      transmission: 'Household food insecurity worsened by lack of foreign exchange to clear grain cargo ships.',
      solution: 'Distributed solar-powered hydroponic fodder and vegetable units to safeguard nutrition.'
    },
    {
      id: 'yemen',
      type: 'importer',
      name: 'Yemen',
      coords: [15.55, 48.51],
      badge: 'Near Famine',
      stat1: '90% Staple Imports',
      stat2: 'WFP Dependent',
      desc: 'Devastated by protracted war, port blockades, and Red Sea shipping risks. 2025-26 humanitarian funding declines forced WFP to reduce coverage.',
      transmission: 'Global wheat and fertilizer price shocks accelerate acute starvation in non-combatant populations.',
      solution: 'Community rainwater harvesting and emergency agritech aid packages with solar irrigation pumps.'
    },
    {
      id: 'sudan',
      type: 'importer',
      name: 'Sudan',
      coords: [12.86, 30.21],
      badge: 'Confirmed Famine (IPC 5)',
      stat1: 'Famine in 2025',
      stat2: 'Conflict Primary Driver',
      desc: 'One of two confirmed IPC Phase 5 famines in 2025 (alongside Gaza). Conflict disrupted agricultural production, destroyed seed banks, and blocked humanitarian supply lines.',
      transmission: 'Fertilizer shocks from Hormuz closure (Mercy Corps) and food system destruction caused severe hunger.',
      solution: 'Enforce UNSC Resolution 2417 against starvation as a weapon of war and deploy mobile agritech survival kits.'
    },
    {
      id: 'sri-lanka',
      type: 'importer',
      name: 'Sri Lanka',
      coords: [7.87, 80.77],
      badge: 'Policy Caution Case',
      stat1: '2021 Organic Ban',
      stat2: '-20% Rice Harvest',
      desc: 'In 2021, the government banned all synthetic fertilizer overnight to go 100% organic. Yields crashed ~20% in rice, devastating tea exports and driving an economic meltdown. The ban was reversed in months.',
      transmission: 'Standard case study proving that abrupt input denial without tested substitutes is self-inflicted agricultural warfare.',
      solution: 'Phased fertilizer efficiency: soil testing, precision dosing, and organic-mineral blends prior to policy mandates.'
    },
    {
      id: 'india',
      type: 'importer',
      name: 'India',
      coords: [20.59, 78.96],
      badge: 'Strategic Swing Actor',
      stat1: '>40% Mideast Urea/Phos',
      stat2: 'Major Domestic Buffer',
      desc: 'High exposure to Hormuz fertilizer imports (>40% of urea & phosphate). Reacted with 2022 wheat export ban after heatwaves and 2023-24 non-basmati rice curbs to secure domestic prices.',
      transmission: 'Domestic price-protection curbs triggered severe rice price inflation across West Africa and Southeast Asia.',
      solution: 'Long-term green ammonia agreements, nano-urea adoption, and domestic soil health cards.'
    },
    {
      id: 'brazil',
      type: 'importer',
      name: 'Brazil',
      coords: [-14.23, -51.92],
      badge: 'Agricultural Giant',
      stat1: '50% Urea via Hormuz',
      stat2: 'Beneficiary of 1973 Ban',
      desc: 'Agricultural powerhouse born in part from the 1973 US soybean embargo on Japan. Today, imports nearly all its synthetic urea, with ~50% transiting Hormuz.',
      transmission: 'The 2026 Hormuz closure sent fertilizer prices surging, endangering 2026-27 crop margins.',
      solution: 'National Fertilizer Plan, biofertilizers, and expanding bilateral ties with Morocco and Canada.'
    },

    // Exporters / Producers
    {
      id: 'morocco',
      type: 'exporter',
      name: 'Morocco (OCP Group)',
      coords: [31.79, -7.09],
      badge: 'Phosphate Superpower',
      stat1: '~70% World P Reserves',
      stat2: 'Diplomatic Shield',
      desc: 'State-owned OCP Group holds ~70% of global phosphate rock reserves. Morocco leverages this through fertilizer diplomacy across Sub-Saharan Africa (custom blends, factories in Nigeria & Ethiopia, agronomy training).',
      transmission: 'Western Sahara legal disputes in EU courts demonstrate how fertilizer supply chains interweave with territorial sovereignty.',
      solution: 'Expansion of African Soil Health Summit targets and regional fertilizer blending plants.'
    },
    {
      id: 'russia',
      type: 'exporter',
      name: 'Russia',
      coords: [61.52, 105.31],
      badge: '#1 Wheat & Fert Exporter',
      stat1: 'Largest Fert Exporter',
      stat2: 'Strategic Grain Statecraft',
      desc: 'World’s largest fertilizer exporter by volume and #1 wheat exporter. Utilized floating export duties, quota systems, discounted supply deals, and free grain donations (25,000-50,000 tonnes to 6 African states in 2023).',
      transmission: 'Togliatti-Odesa pipeline closure and financial friction created structural world input tightness.',
      solution: 'Multilateral WTO disciplines on agricultural export bans and standing humanitarian carve-outs.'
    },
    {
      id: 'china',
      type: 'exporter',
      name: 'China',
      coords: [35.86, 104.19],
      badge: 'Input Dominance',
      stat1: '43% Phosphate, 30% N',
      stat2: 'Export Quota Regulator',
      desc: 'Dominates global nitrogen and phosphate production. Imposed tight inspection curbs in 2021; relaxed urea quotas to 5-5.5 Mt in 2026, which eased the global fertilizer market after the Hormuz shock.',
      transmission: 'Unilateral quota adjustments instantly swing spot prices in India, Pakistan, and Latin America.',
      solution: 'Establish bilateral supply predictability pacts and multilateral input transparency under AMIS.'
    },
    {
      id: 'canada',
      type: 'exporter',
      name: 'Canada',
      coords: [56.13, -106.34],
      badge: 'Potash Anchor',
      stat1: '33% Global Potash',
      stat2: 'Stable Rule-of-Law Hub',
      desc: 'World’s top producer of potash (Saskatchewan basin). Essential buffer against Russian and Belarusian sanctions-related supply reductions.',
      transmission: 'Supplies key agricultural breadbaskets across the Americas and Asia.',
      solution: 'Increase port handling throughput and expand Agritech bilateral trade agreements.'
    },

    // Agritech Hubs
    {
      id: 'netherlands',
      type: 'agritech',
      name: 'Netherlands',
      coords: [52.13, 5.29],
      badge: 'CEA Innovation Leader',
      stat1: '60-70 kg/m² Tomato Yields',
      stat2: 'Wageningen Knowledge Hub',
      desc: 'Pioneered high-tech controlled environment horticulture with yields exceeding 60-70 kg/m²/yr while slashing water usage.',
      transmission: 'Exports turnkey greenhouses, climate computers, and water recirculating systems globally.',
      solution: 'Dutch Agri-Food Partnerships transferring knowledge and adapting CEA to hot-climate arid environments.'
    },
    {
      id: 'israel',
      type: 'agritech',
      name: 'Israel',
      coords: [31.04, 34.85],
      badge: 'Precision Irrigation',
      stat1: 'MASHAV Global Aid',
      stat2: 'Drip Irrigation Pioneer',
      desc: 'Pioneer of micro-drip irrigation, fertigation, and saline/desalinated water agronomy. MASHAV programs have trained agronomists in over 100 countries.',
      transmission: 'Reduces irrigation water losses by 40-60% across water-scarce dryland basins.',
      solution: 'Scale South-South and North-South agritech transfer without proprietary seed lock-in.'
    },
    {
      id: 'japan',
      type: 'agritech',
      name: 'Japan (JICA)',
      coords: [36.20, 138.25],
      badge: 'CARD Rice Initiative',
      stat1: 'Sub-Saharan Africa Rice',
      stat2: 'Double Rice Production',
      desc: 'The Coalition for African Rice Development (CARD) launched by JICA doubled rice output across Sub-Saharan Africa, reducing reliance on volatile Asian imports.',
      transmission: 'Proves how capability transfer creates lasting food autonomy.',
      solution: 'Model for Agritech Diplomacy: shift offers from emergency grain aid to permanent domestic production capacity.'
    }
  ];

  // Document Explorer Chapters (Full Synthesis of PDF Report)
  const chaptersData = [
    {
      number: '1',
      title: 'Executive Summary',
      tag: 'Overview',
      tagColor: 'emerald',
      topics: ['overview', 'chokepoint', 'fertilizer'],
      content: `
        <h4 class="font-bold text-slate-100 text-sm mb-2">The New Era of Strategic Agricultural Leverage</h4>
        <p class="mb-2">For most of the post-1945 era, grain, oilseeds, and fertilizer were treated as ordinary commodities: bulky, cheap, and governed by weather and price. That assumption no longer holds. Between 2020 and 2026, the pandemic, the invasion of Ukraine, waves of export bans, and the 2026 closure of the Strait of Hormuz demonstrated that farming inputs and outputs are strategic levers to project power, punish rivals, and forge dependencies.</p>
        <p class="mb-2">Wheat is concentrated in a few exporters; nitrogen is tied to natural gas and Gulf/Eurasian producers; phosphate to China and Morocco; and potash to Canada, Russia, and Belarus. Every concentration represents a critical choke point.</p>
        <div class="bg-slate-950 p-3 rounded-lg border border-slate-800 my-3">
          <strong class="text-emerald-400 block mb-1">Key Takeaway:</strong>
          Lasting protection comes not from hoping exporters behave, but from attacking the <em>substitutability gap</em> through <strong>Agritech Diplomacy</strong>: exporting irrigation, controlled-environment agriculture, precision soil testing, and local input blending to vulnerable partners.
        </div>
      `
    },
    {
      number: '2',
      title: 'Problem Statement: The Weaponization of Agriculture',
      tag: 'Weaponization',
      tagColor: 'red',
      topics: ['chokepoint', 'wheat'],
      content: `
        <h4 class="font-bold text-slate-100 text-sm mb-2">Why Food and Fertilizer Are Unusually Potent Levers</h4>
        <p class="mb-2">Food is the most inelastic of all goods: households cannot postpone eating, and governments know that bread price inflation can swiftly topple regimes. Three structural features create this vulnerability:</p>
        <ul class="list-disc pl-5 mb-3 space-y-1 text-slate-300">
          <li><strong>High Concentration:</strong> A handful of exporters supply the bulk of traded wheat, maize, rice, vegetable oils, and key fertilizers.</li>
          <li><strong>Low Short-Run Substitutability:</strong> Importers cannot rapidly source or grow alternatives due to agro-climatic boundaries, logistics, and rigid planting seasons.</li>
          <li><strong>Thin Buffers:</strong> Most import-dependent nations hold only weeks of strategic cover with constrained foreign-exchange reserves.</li>
        </ul>
        <h4 class="font-bold text-slate-100 text-sm mb-2">Instruments of Agricultural Coercion</h4>
        <p class="mb-2">Documented mechanisms include: Export bans/quotas (India 2022 wheat, 2023 rice), Targeted embargoes (1980 US-USSR), Retaliatory tariffs (China-Australia barley 2020-23), Aid conditionality (PL-480 in Egypt 1960s), Blockades and port attacks (Black Sea 2022-23), Corridor conditionality (Black Sea Grain Initiative renewals tied to SWIFT/ammonia demands), and Regulatory pretexts (customs inspections).</p>
      `
    },
    {
      number: '3',
      title: 'Historical and Modern Cases of Food Diplomacy',
      tag: 'Case Studies',
      tagColor: 'amber',
      topics: ['wheat', 'chokepoint'],
      content: `
        <h4 class="font-bold text-slate-100 text-sm mb-2">Lessons from Great-Power Denial</h4>
        <p class="mb-2"><strong>1973 US Soybean Embargo:</strong> Imposed temporary export controls to curb domestic inflation. Major buyer Japan was shocked and diversified into Brazil—accelerating Brazil’s rise as an agricultural titan.</p>
        <p class="mb-2"><strong>1980 US Grain Embargo:</strong> President Carter suspended 17M tonnes of grain to the USSR after Afghanistan. Argentina, Canada, and the EU backfilled supply; US farmers bore immense financial costs, and President Reagan lifted the embargo in 1981. Lesson: Unilateral denial fails when buyers can substitute, permanently eroding exporter market share.</p>
        <p class="mb-2"><strong>Aid as Leverage (PL-480):</strong> In the 1960s, the US kept Egypt on a 'short leash' of wheat shipments over divergent foreign policies, pushing Cairo towards Soviet supply and permanent source diversification.</p>
        <p class="mb-2"><strong>Food as a Weapon of War:</strong> Holodomor (1932-33), Biafra blockade (1967-70). In 2025, the GRFC recorded <em>two confirmed famines (IPC Phase 5) in a single year</em> (Gaza and Sudan) driven primarily by conflict.</p>
      `
    },
    {
      number: '4',
      title: 'Cases of Fertilizer Diplomacy & The 2026 Hormuz Shock',
      tag: 'Fertilizer Shock',
      tagColor: 'orange',
      topics: ['fertilizer', 'chokepoint'],
      content: `
        <h4 class="font-bold text-slate-100 text-sm mb-2">Concentration of the Three Macronutrients</h4>
        <p class="mb-2"><strong>Nitrogen (N):</strong> 70-90% of ammonia cash cost is natural gas. China (30%), Russia (10%), India (9%), USA (9%), Gulf States.</p>
        <p class="mb-2"><strong>Phosphate (P):</strong> China 43% mine output; Morocco (OCP) controls ~70% of global rock reserves.</p>
        <p class="mb-2"><strong>Potash (K):</strong> Canada (33%), Russia (19%), Belarus (16%)—over two-thirds of global supply.</p>
        <div class="bg-red-950/40 border border-red-800/60 p-3 rounded-lg my-3">
          <h5 class="font-bold text-red-300 text-xs mb-1">Box A: The 2026 Hormuz Fertilizer Shock Live Stress Test</h5>
          <p class="text-[11px] text-slate-300">On 28 February 2026, war involving the US, Israel, and Iran broke out. Commercial traffic through Hormuz collapsed, exposing ~20% of traded nitrogen and major sulfur feedstock. Urea doubled to ~$700/tonne in March (Argus/Reuters). Despite an 8 April ceasefire, shipments stayed near zero through September. Eased to ~$443/t after China widened its export quota to 5-5.5 Mt.</p>
          <p class="text-[11px] text-slate-300 mt-1">India imports &gt;40% and Brazil imports ~50% of urea via Hormuz. Mercy Corps documents downstream hunger surges in Sudan, Somalia, Ethiopia, and Lebanon.</p>
        </div>
        <p class="text-xs"><strong>Sri Lanka 2021 Precedent:</strong> Abrupt 100% organic fertilizer mandate cut rice yields ~20%, wrecked tea exports, and caused fiscal collapse. Warning: Never ban synthetic inputs without tested substitutes.</p>
      `
    },
    {
      number: '5',
      title: 'Deep-Dive: Russia-Ukraine Wheat Diplomacy & MENA',
      tag: 'Deep Dive',
      tagColor: 'blue',
      topics: ['wheat', 'chokepoint'],
      content: `
        <h4 class="font-bold text-slate-100 text-sm mb-2">Black Sea Supply Chain and Strategic Levers</h4>
        <p class="mb-2">Prior to 2022, Russia and Ukraine accounted for ~30% of global wheat exports and &gt;50% of sunflower oil. The naval blockade stranded 20M+ tonnes, propelling Chicago wheat to historic highs and the FAO Index to 160.2 in March 2022.</p>
        <p class="mb-2"><strong>The Black Sea Grain Initiative (BSGI):</strong> Brokered by Turkey and the UN, exported ~33 Mt before Russia withdrew in July 2023. Moscow used conditional renewals (shortened to 60-day windows) as leverage to demand SWIFT reconnection for Rosselkhozbank and ammonia pipeline reopening.</p>
        <h4 class="font-bold text-slate-100 text-sm mb-2">Impact on Middle East and North Africa</h4>
        <p class="mb-2">MENA is the world’s largest net cereal importer and most water-scarce region. Subsidized bread is a foundational social contract.</p>
        <p class="text-xs text-slate-300">&bull; <strong>Egypt:</strong> World’s #1 wheat importer (12-13 Mt/yr; 80% Black Sea origin pre-war). Pound devalued severely in 2022-24; rescued by IMF and $35B UAE Ras El-Hekma deal.</p>
        <p class="text-xs text-slate-300">&bull; <strong>Lebanon:</strong> Lost 85% of grain storage when Beirut port silos exploded in 2020. Compounded by financial collapse.</p>
        <p class="text-xs text-slate-300">&bull; <strong>Yemen:</strong> 90% staple food imported; Red Sea shipping risks elevated costs as aid donations dropped.</p>
      `
    },
    {
      number: '6',
      title: 'The Global Right to Food and Institutional Defenses',
      tag: 'Legal Framework',
      tagColor: 'purple',
      topics: ['overview'],
      content: `
        <h4 class="font-bold text-slate-100 text-sm mb-2">Legal Instruments vs Enforcement Reality</h4>
        <p class="mb-2">Key legal bases include ICESCR Art. 11 (Right to Adequate Food), Additional Protocol I Art. 54 (prohibiting starvation of civilians), Rome Statute Art. 8(2)(b)(xxv) (starvation as a war crime), and UNSC Resolution 2417 (2018).</p>
        <p class="mb-2 text-rose-300 font-medium">The Central Weakness: Rights are individual, but states’ duties are diffuse. No binding international treaty prohibits an exporter from restricting commercial sales to another sovereign state, and WTO Article 12 rules remain largely hortatory.</p>
        <h4 class="font-bold text-slate-100 text-sm mb-2">Institutional Alarms (2026)</h4>
        <p class="text-xs text-slate-300">&bull; <strong>UN SOFI 2026:</strong> 645M people faced hunger in 2025; 2.1B moderately or severely food insecure; Africa (309M) overtook Asia (292M) as the most food-insecure continent. 2.7B cannot afford a healthy diet.</p>
        <p class="text-xs text-slate-300">&bull; <strong>WFP:</strong> Funding shortfalls force prioritization; plans to reach 110M in 2026 (only 1/3 of those in need).</p>
        <p class="text-xs text-slate-300">&bull; <strong>World Bank (June 2026):</strong> Fertilizer prices projected up 31% in 2026 due to Hormuz disruption.</p>
      `
    },
    {
      number: '7',
      title: 'Future Outlook: Climate Change & Vulnerable Nations',
      tag: 'Climate Risks',
      tagColor: 'amber',
      topics: ['overview', 'tech'],
      content: `
        <h4 class="font-bold text-slate-100 text-sm mb-2">Climate as a Coercion Multiplier</h4>
        <p class="mb-2">IPCC AR6 confirms agricultural productivity growth is decelerating in low latitudes. Pressures over the next two decades:</p>
        <ul class="list-disc pl-5 mb-3 space-y-1 text-xs text-slate-300">
          <li><strong>Heatwaves & Drought:</strong> 2022 Indian heatwave prompted wheat export ban; 2020-23 Horn of Africa drought affected millions.</li>
          <li><strong>Water Scarcity:</strong> Agriculture takes 70% of freshwater. WRI Aqueduct identifies MENA as most water-stressed. Transboundary tension on Nile, Tigris-Euphrates, Indus.</li>
          <li><strong>Delta Salinization:</strong> Nile Delta and Bangladesh facing farmland losses from rising sea levels.</li>
          <li><strong>Correlated Breadbasket Failures:</strong> Synchronous weather shocks in multiple exporter countries trigger panic export restrictions.</li>
        </ul>
      `
    },
    {
      number: '8',
      title: 'The Solution: Agritech Diplomacy Framework',
      tag: 'Strategic Framework',
      tagColor: 'emerald',
      topics: ['tech', 'roadmap'],
      content: `
        <h4 class="font-bold text-slate-100 text-sm mb-2">Definition and Core Equation</h4>
        <p class="mb-2"><strong>Agritech Diplomacy:</strong> A foreign policy approach where states, development banks, and firms deliberately export agricultural technology, knowledge, finance, and standards to raise partner countries’ domestic yields, input self-sufficiency, and climate resilience while forging strategic autonomy.</p>
        <div class="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-center text-xs text-emerald-400 my-2">
          Leverage = Dependence &times; Non-Substitutability
        </div>
        <p class="mb-2 text-xs">Agritech attacks the second term: Every tonne produced locally, every alternative supplier qualified, every month of reserve stock, and every locally blended nutrient weakens a coercer’s leverage.</p>
        <h4 class="font-bold text-slate-100 text-sm mb-2">The Five Pillars of Practice</h4>
        <ol class="list-decimal pl-5 space-y-1 text-xs text-slate-300">
          <li><strong>Technology Transfer:</strong> Drip irrigation, climate-smart seeds, CEA greenhouses, cold chains (MASHAV, Dutch partnerships, JICA CARD, Korea K-Food Belt).</li>
          <li><strong>Finance & Risk-Sharing:</strong> Blended finance, green-ammonia co-investment, Multilateral development windows.</li>
          <li><strong>Local Input Production:</strong> Regional blending, biofertilizers, organic-mineral blends (OCP Africa plants, Nigeria Dangote urea).</li>
          <li><strong>Capacity & Standards:</strong> Wageningen-style agronomy extension and South-South cooperation.</li>
          <li><strong>Data & Early Warning:</strong> Satellite soil tracking, AMIS market monitors.</li>
        </ol>
      `
    },
    {
      number: '9',
      title: 'Technical Solution: Hydroponics & Aquaponics Analysis',
      tag: 'Technical CEA',
      tagColor: 'cyan',
      topics: ['tech'],
      content: `
        <h4 class="font-bold text-slate-100 text-sm mb-2">Closed-Loop Controlled-Environment Agriculture</h4>
        <p class="mb-2"><strong>Hydroponics (Barbosa et al. 2015 study):</strong> Produces 10.5x yield per unit area (41 vs 3.9 kg/m²/yr) and uses &gt;90% less water (20 vs 250 L/kg), but requires 82x more energy (90k vs 1.1k kJ/kg) for HVAC/lighting. High-tech Dutch greenhouses exceed 60-70 kg/m².</p>
        <p class="mb-2"><strong>Aquaponics Closed Loop:</strong> Fish (tilapia, catfish) produce ammonia &rarr; Nitrifying bacteria biofilter converts ammonia to nitrite and then nitrate &rarr; Plants absorb nitrate &rarr; 95%+ clean water returned to fish tank. Provides both vegetable micronutrients and domestic fish protein with zero synthetic N-P input.</p>
        <div class="p-3 bg-slate-950 rounded-lg border border-slate-800 my-3 text-xs">
          <strong class="text-emerald-400 block mb-1">Analytical Verdict:</strong>
          CEA is a <em>resilience layer</em>, not a total replacement for staple grains. It shields perishable high-value crops (tomatoes, greens, cucumbers) and saves FX reserves. For staples (wheat, maize), pair with precision fertilizer (-10-20% N), legume crop rotation, drought seeds, and regional green ammonia.
        </div>
      `
    },
    {
      number: '10',
      title: 'Conclusion & 3-Horizon Strategic Roadmap',
      tag: 'Roadmap',
      tagColor: 'emerald',
      topics: ['roadmap', 'overview'],
      content: `
        <h4 class="font-bold text-slate-100 text-sm mb-2">Phased Policy Action Plan</h4>
        <div class="space-y-3 text-xs">
          <div class="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span class="font-bold text-amber-400 block mb-1">Horizon 1: 0 - 12 Months (Emergency Relief & Rerouting)</span>
            <p class="text-slate-300">&bull; Emergency financing for fertilizer-dependent smallholders.<br>&bull; Map exposure to Hormuz and Black Sea routes; qualify emergency supplier lists.<br>&bull; Expand export-restriction tracking under AMIS and WTO.</p>
          </div>
          <div class="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span class="font-bold text-blue-400 block mb-1">Horizon 2: 1 - 3 Years (Agritech Capability Transfer)</span>
            <p class="text-slate-300">&bull; Launch Agritech Diplomacy financing windows within development banks.<br>&bull; Pilot peri-urban CEA clusters and training centers.<br>&bull; Establish regional fertilizer blending plants and soil testing campaigns.</p>
          </div>
          <div class="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span class="font-bold text-emerald-400 block mb-1">Horizon 3: 3 - 10 Years (Structural Independence)</span>
            <p class="text-slate-300">&bull; Scale renewable solar-powered CEA and precision irrigation.<br>&bull; Commission green-ammonia plants to decouple nitrogen from fossil gas.<br>&bull; Legislate binding WTO disciplines on food and fertilizer export bans.</p>
          </div>
        </div>
      `
    }
  ];

  // ==========================================================
  // INITIALIZATION & TAB SWITCHING
  // ==========================================================

  function initTabs() {
    const navButtons = document.querySelectorAll('.nav-tab');
    const viewPanels = document.querySelectorAll('.view-panel');
    const titleEl = document.getElementById('current-view-title');
    const subtitleEl = document.getElementById('current-view-subtitle');

    const subtitles = {
      dashboard: 'Executive synthesis of global food and fertilizer geopolitical dynamics & live metrics',
      map: 'Interactive GIS mapping of supply choke points, vulnerable importers, and trade corridors',
      analytics: 'Extracted datasets from USGS, FAO, and Barbosa et al. on N-P-K and CEA efficiency',
      simulator: 'Dynamic modeling of geopolitical supply shocks and agritech defense levers',
      explorer: 'Comprehensive chapter-by-chapter intelligence archive based on the October 2026 report'
    };

    const titles = {
      dashboard: 'Dashboard Overview',
      map: 'Geopolitical Impact Map',
      analytics: 'Agritech Matrix & Charts',
      simulator: 'Diplomacy & Shock Simulator',
      explorer: 'Document Knowledge Base'
    };

    function switchTab(tabId) {
      AppState.currentTab = tabId;

      navButtons.forEach(btn => {
        const isCurrent = btn.dataset.tab === tabId;
        btn.classList.toggle('text-emerald-400', isCurrent);
        btn.classList.toggle('bg-slate-800/80', isCurrent);
        btn.classList.toggle('border', isCurrent);
        btn.classList.toggle('border-slate-700/60', isCurrent);
        btn.classList.toggle('shadow-sm', isCurrent);
        btn.classList.toggle('text-slate-300', !isCurrent);
        btn.classList.toggle('hover:bg-slate-800/50', !isCurrent);
      });

      viewPanels.forEach(panel => {
        if (panel.id === `view-${tabId}`) {
          panel.classList.remove('hidden');
        } else {
          panel.classList.add('hidden');
        }
      });

      if (titleEl) titleEl.textContent = titles[tabId] || 'Dashboard Overview';
      if (subtitleEl) subtitleEl.textContent = subtitles[tabId] || '';

      // Close mobile nav if open
      const sidebar = document.getElementById('app-sidebar');
      const backdrop = document.getElementById('mobile-backdrop');
      if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.add('-translate-x-full');
        backdrop.classList.add('hidden');
      }

      // If switching to map, trigger map size invalidate
      if (tabId === 'map' && AppState.map) {
        setTimeout(() => {
          AppState.map.invalidateSize();
        }, 200);
      }
    }

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        switchTab(btn.dataset.tab);
      });
    });

    // Handle in-page buttons that switch tabs
    document.querySelectorAll('[data-switch-to]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-switch-to');
        if (targetTab) switchTab(targetTab);
      });
    });

    const btnQuickStress = document.getElementById('btn-quick-stress');
    if (btnQuickStress) {
      btnQuickStress.addEventListener('click', () => switchTab('simulator'));
    }

    const btnInspectInExplorer = document.getElementById('btn-inspect-in-explorer');
    if (btnInspectInExplorer) {
      btnInspectInExplorer.addEventListener('click', () => switchTab('explorer'));
    }
  }

  // Mobile Navigation toggle
  function initMobileNav() {
    const openBtn = document.getElementById('open-mobile-nav');
    const closeBtn = document.getElementById('close-mobile-nav');
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('mobile-backdrop');

    if (openBtn && sidebar && backdrop) {
      openBtn.addEventListener('click', () => {
        sidebar.classList.remove('-translate-x-full');
        backdrop.classList.remove('hidden');
      });
    }

    if (closeBtn && sidebar && backdrop) {
      closeBtn.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full');
        backdrop.classList.add('hidden');
      });
    }

    if (backdrop && sidebar) {
      backdrop.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full');
        backdrop.classList.add('hidden');
      });
    }
  }

  // Executive Brief Modal
  function initModal() {
    const openBtn = document.getElementById('btn-quick-brief');
    const modal = document.getElementById('modal-executive-brief');
    const closeBtn1 = document.getElementById('close-brief-modal');
    const closeBtn2 = document.getElementById('close-brief-modal-btn');

    function openModal() {
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }
    }

    function closeModal() {
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    }

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn1) closeBtn1.addEventListener('click', closeModal);
    if (closeBtn2) closeBtn2.addEventListener('click', closeModal);

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }
  }

  // ==========================================================
  // LEAFLET MAP VISUALIZATION ENGINE
  // ==========================================================

  function initMap() {
    const mapContainer = document.getElementById('geopoliticalMap');
    if (!mapContainer || !window.L) return;

    // Center map on MENA / Eurasia hub
    const map = window.L.map('geopoliticalMap', {
      center: [28.0, 42.0],
      zoom: 3.2,
      minZoom: 2,
      maxZoom: 10,
      zoomControl: false
    });

    // Custom Zoom Control top right
    window.L.control.zoom({ position: 'topright' }).addTo(map);

    // Dark Basemap from CartoDB
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    AppState.map = map;

    // Helper: Build SVG Icon
    function createCustomIcon(type, isPulsing = false) {
      let color = '#3b82f6';
      let iconSymbol = '●';
      let pulseClass = '';

      if (type === 'chokepoint') {
        color = '#ef4444';
        iconSymbol = '⚠';
        if (isPulsing) pulseClass = 'choke-marker-pulse';
      } else if (type === 'importer') {
        color = '#f59e0b';
        iconSymbol = '▼';
      } else if (type === 'exporter') {
        color = '#3b82f6';
        iconSymbol = '▲';
      } else if (type === 'agritech') {
        color = '#10b981';
        iconSymbol = '★';
        pulseClass = 'green-marker-pulse';
      }

      return window.L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div class="${pulseClass}" style="
            width: 26px; 
            height: 26px; 
            background: ${color}; 
            border: 2px solid #ffffff; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: #ffffff; 
            font-size: 11px; 
            font-weight: bold;
            box-shadow: 0 4px 10px rgba(0,0,0,0.6);
            cursor: pointer;">
            ${iconSymbol}
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });
    }

    // Populate Entities
    mapEntities.forEach(entity => {
      const isPulse = entity.id === 'hormuz' || entity.id === 'netherlands';
      const marker = window.L.marker(entity.coords, {
        icon: createCustomIcon(entity.type, isPulse),
        title: entity.name
      }).addTo(map);

      // Popup content
      const popupHtml = `
        <div class="text-xs space-y-1.5 p-1">
          <div class="flex items-center justify-between gap-2 border-b border-slate-700 pb-1">
            <span class="font-bold text-slate-100 text-sm">${entity.name}</span>
            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded ${entity.type === 'chokepoint' ? 'bg-red-950 text-red-300' : 'bg-slate-800 text-slate-300'}">${entity.badge}</span>
          </div>
          <p class="text-slate-300 text-[11px] leading-relaxed line-clamp-2">${entity.desc}</p>
          <div class="text-[10px] font-mono text-emerald-400">Click marker to load strategic profile &rarr;</div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        updateMapDetailSidebar(entity);
      });

      AppState.mapMarkers.push({ marker, entity });
    });

    // Draw Corridors (Trade flows & disruptions)
    // 1. Hormuz Disruptive flow to India and Brazil (Red dashed)
    const hormuzFlow = [
      [26.56, 56.25], // Hormuz
      [22.0, 65.0],
      [20.59, 78.96]  // India
    ];
    const hormuzPoly = window.L.polyline(hormuzFlow, {
      color: '#ef4444',
      weight: 3.5,
      dashArray: '6, 6',
      opacity: 0.85
    }).addTo(map);
    hormuzPoly.bindTooltip('Disrupted Fertilizer Route (Hormuz &rarr; India)', { sticky: true });
    AppState.mapLines.push(hormuzPoly);

    // 2. Black Sea Wheat Corridor to Egypt & Lebanon (Cyan)
    const blackSeaFlow = [
      [46.48, 30.73], // Odesa
      [41.02, 28.97], // Bosphorus
      [35.0, 31.0],
      [31.2, 32.3],   // Port Said / Egypt
      [33.85, 35.86]  // Lebanon
    ];
    const blackSeaPoly = window.L.polyline(blackSeaFlow, {
      color: '#06b6d4',
      weight: 2.5,
      opacity: 0.8
    }).addTo(map);
    blackSeaPoly.bindTooltip('Black Sea Grain Corridor to MENA', { sticky: true });
    AppState.mapLines.push(blackSeaPoly);

    // 3. Morocco OCP African Phosphate Diplomacy Corridor (Emerald)
    const moroccoFlow = [
      [31.79, -7.09], // Morocco
      [14.7, -17.4],  // West Africa
      [9.08, 7.5],    // Nigeria (Dangote/OCP Blends)
      [0.34, 32.5]    // East Africa
    ];
    const moroccoPoly = window.L.polyline(moroccoFlow, {
      color: '#10b981',
      weight: 2.5,
      dashArray: '4, 4',
      opacity: 0.85
    }).addTo(map);
    moroccoPoly.bindTooltip('Morocco OCP Pan-African Fertilizer Diplomacy Corridor', { sticky: true });
    AppState.mapLines.push(moroccoPoly);

    // Initialize Filter Buttons
    initMapFilterButtons();
  }

  function updateMapDetailSidebar(entity) {
    const titleEl = document.getElementById('detail-title');
    const catEl = document.getElementById('detail-category');
    const locEl = document.getElementById('detail-location');
    const statusEl = document.getElementById('detail-status-pill');
    const stat1El = document.getElementById('detail-stat-1');
    const stat2El = document.getElementById('detail-stat-2');
    const descEl = document.getElementById('detail-desc');
    const transEl = document.getElementById('detail-transmission');
    const solEl = document.getElementById('detail-solution');

    if (titleEl) titleEl.textContent = entity.name;
    if (catEl) catEl.textContent = entity.type.toUpperCase();
    if (locEl) locEl.textContent = `Coordinates: ${entity.coords[0].toFixed(2)}°N, ${entity.coords[1].toFixed(2)}°E`;
    if (statusEl) statusEl.textContent = entity.badge;
    if (stat1El) stat1El.textContent = entity.stat1;
    if (stat2El) stat2El.textContent = entity.stat2;
    if (descEl) descEl.textContent = entity.desc;
    if (transEl) transEl.textContent = entity.transmission;
    if (solEl) solEl.textContent = entity.solution;
  }

  function initMapFilterButtons() {
    const filterButtons = document.querySelectorAll('.map-layer-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => {
          b.classList.remove('bg-emerald-600', 'text-white');
          b.classList.add('bg-slate-800', 'text-slate-300');
        });
        btn.classList.add('bg-emerald-600', 'text-white');
        btn.classList.remove('bg-slate-800', 'text-slate-300');

        const filterId = btn.id.replace('map-filter-', '');
        applyMapFilter(filterId);
      });
    });
  }

  function applyMapFilter(filterId) {
    AppState.mapMarkers.forEach(({ marker, entity }) => {
      if (filterId === 'all') {
        marker.addTo(AppState.map);
      } else if (filterId === 'chokepoints' && entity.type === 'chokepoint') {
        marker.addTo(AppState.map);
      } else if (filterId === 'importers' && entity.type === 'importer') {
        marker.addTo(AppState.map);
      } else if (filterId === 'exporters' && entity.type === 'exporter') {
        marker.addTo(AppState.map);
      } else if (filterId === 'agritech' && entity.type === 'agritech') {
        marker.addTo(AppState.map);
      } else {
        marker.remove();
      }
    });
  }

  // ==========================================================
  // CHART.JS ANALYTICS ENGINE
  // ==========================================================

  function initCharts() {
    if (!window.Chart) return;

    // Global Chart.js styling
    window.Chart.defaults.color = '#94a3b8';
    window.Chart.defaults.font.family = 'inherit';
    window.Chart.defaults.borderColor = 'rgba(51, 65, 85, 0.4)';

    // 1. FAO Food Price Index (Figure 2)
    const faoCtx = document.getElementById('faoIndexChart');
    if (faoCtx) {
      AppState.charts.fao = new window.Chart(faoCtx, {
        type: 'line',
        data: {
          labels: faoIndexData.labels,
          datasets: [
            {
              label: 'FAO Food Price Index (2014-2016 = 100)',
              data: faoIndexData.values,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: true,
              tension: 0.3,
              pointBackgroundColor: '#10b981',
              pointRadius: 4,
              borderWidth: 2.5
            },
            {
              label: 'Pre-2020 Baseline (100.0)',
              data: Array(faoIndexData.labels.length).fill(100),
              borderColor: 'rgba(148, 163, 184, 0.5)',
              borderDash: [5, 5],
              fill: false,
              pointRadius: 0,
              borderWidth: 1.5
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
            tooltip: {
              callbacks: {
                afterBody: (ctx) => {
                  if (ctx[0].label === '2022') {
                    return 'Peak Monthly: 160.2 (March 2022, Ukraine invasion)';
                  }
                  return '';
                }
              }
            }
          },
          scales: {
            y: {
              min: 80,
              max: 165,
              grid: { color: 'rgba(51, 65, 85, 0.3)' },
              ticks: { font: { size: 10 } }
            },
            x: {
              grid: { display: false },
              ticks: { font: { size: 10 } }
            }
          }
        }
      });
    }

    // 2. Macronutrient Concentration Chart (Figure 3)
    const nutCtx = document.getElementById('nutrientConcentrationChart');
    if (nutCtx) {
      renderNutrientChart('all');
    }

    // 3. Exposure Matrix Scatter/Bubble Chart (Figure 4)
    const expCtx = document.getElementById('exposureMatrixChart');
    if (expCtx) {
      AppState.charts.exposure = new window.Chart(expCtx, {
        type: 'scatter',
        data: {
          datasets: [
            {
              label: 'High Coercion & Famine Risk',
              data: exposurePoints.filter(p => p.category === 'critical').map(p => ({ x: p.x, y: p.y, name: p.name, desc: p.desc })),
              backgroundColor: '#ef4444',
              borderColor: '#ffffff',
              borderWidth: 1.5,
              pointRadius: 8,
              pointHoverRadius: 10
            },
            {
              label: 'High Vulnerability / Fiscal Strain',
              data: exposurePoints.filter(p => p.category === 'high').map(p => ({ x: p.x, y: p.y, name: p.name, desc: p.desc })),
              backgroundColor: '#f59e0b',
              borderColor: '#ffffff',
              borderWidth: 1.5,
              pointRadius: 7,
              pointHoverRadius: 9
            },
            {
              label: 'Moderate Vulnerability',
              data: exposurePoints.filter(p => p.category === 'medium' || p.category === 'caution').map(p => ({ x: p.x, y: p.y, name: p.name, desc: p.desc })),
              backgroundColor: '#3b82f6',
              borderColor: '#ffffff',
              borderWidth: 1.5,
              pointRadius: 6,
              pointHoverRadius: 8
            },
            {
              label: 'Financial Buffers (GCC)',
              data: exposurePoints.filter(p => p.category === 'buffered').map(p => ({ x: p.x, y: p.y, name: p.name, desc: p.desc })),
              backgroundColor: '#10b981',
              borderColor: '#ffffff',
              borderWidth: 1.5,
              pointRadius: 7,
              pointHoverRadius: 9
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const raw = ctx.raw;
                  return `${raw.name}: Dep ${raw.x}, Stress ${raw.y} (${raw.desc})`;
                }
              }
            }
          },
          scales: {
            x: {
              min: 3,
              max: 10.5,
              title: { display: true, text: 'Import & Input Dependence (1-10)', color: '#94a3b8', font: { size: 10 } },
              grid: { color: 'rgba(51, 65, 85, 0.3)' }
            },
            y: {
              min: 2,
              max: 10.5,
              title: { display: true, text: 'Climate & Water Stress / Low Adaptive Capacity (1-10)', color: '#94a3b8', font: { size: 10 } },
              grid: { color: 'rgba(51, 65, 85, 0.3)' }
            }
          }
        }
      });
    }

    // 4. Controlled Agriculture (CEA) vs Open Field (Figure 6)
    const ceaCtx = document.getElementById('ceaComparisonChart');
    if (ceaCtx) {
      renderCeaChart();
    }

    // Nutrient chart toggle buttons
    document.querySelectorAll('.nutrient-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nutrient-toggle').forEach(b => {
          b.classList.remove('bg-emerald-600', 'text-white', 'active');
          b.classList.add('text-slate-300');
        });
        btn.classList.add('bg-emerald-600', 'text-white', 'active');
        btn.classList.remove('text-slate-300');

        const mode = btn.id.replace('btn-nut-', '');
        renderNutrientChart(mode);
      });
    });

    // Toggle CEA Scale (Log vs Linear)
    const toggleCeaBtn = document.getElementById('toggle-cea-scale');
    if (toggleCeaBtn) {
      toggleCeaBtn.addEventListener('click', () => {
        AppState.ceaScale = AppState.ceaScale === 'log' ? 'linear' : 'log';
        toggleCeaBtn.textContent = AppState.ceaScale === 'log' ? 'Switch to Linear' : 'Switch to Log Scale';
        renderCeaChart();
      });
    }
  }

  function renderNutrientChart(nutrient) {
    const nutCtx = document.getElementById('nutrientConcentrationChart');
    if (!nutCtx) return;

    if (AppState.charts.nutrient) {
      AppState.charts.nutrient.destroy();
    }

    let labels = [];
    let datasets = [];

    if (nutrient === 'all') {
      labels = ['Nitrogen (Ammonia)', 'Phosphate Rock', 'Potash'];
      datasets = [
        { label: 'Leading Producer (China/Canada)', data: [30, 43, 33], backgroundColor: '#ef4444' },
        { label: 'Second Producer (Russia/Morocco)', data: [10, 14, 19], backgroundColor: '#10b981' },
        { label: 'Third Producer (India/USA/Belarus)', data: [9, 9, 16], backgroundColor: '#f59e0b' },
        { label: 'Fourth (USA/Russia/China)', data: [9, 6, 14], backgroundColor: '#3b82f6' },
        { label: 'Others / Rest of World', data: [42, 28, 18], backgroundColor: '#64748b' }
      ];

      AppState.charts.nutrient = new window.Chart(nutCtx, {
        type: 'bar',
        data: { labels, datasets },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}% share`
              }
            }
          },
          scales: {
            x: {
              stacked: true,
              max: 100,
              grid: { color: 'rgba(51, 65, 85, 0.3)' },
              ticks: { callback: (v) => `${v}%` }
            },
            y: {
              stacked: true,
              grid: { display: false }
            }
          }
        }
      });
    } else {
      const nutrientKey = nutrient === 'n' ? 'nitrogen' : nutrient === 'p' ? 'phosphate' : 'potash';
      const rawData = nutrientData[nutrientKey];
      labels = rawData.map(d => d.country);
      const dataValues = rawData.map(d => d.share);
      const colors = rawData.map(d => d.color);

      AppState.charts.nutrient = new window.Chart(nutCtx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: dataValues,
            backgroundColor: colors,
            borderWidth: 1.5,
            borderColor: '#0f172a'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${ctx.raw}% global production`
              }
            }
          }
        }
      });
    }
  }

  function renderCeaChart() {
    const ceaCtx = document.getElementById('ceaComparisonChart');
    if (!ceaCtx) return;

    if (AppState.charts.cea) {
      AppState.charts.cea.destroy();
    }

    const isLog = AppState.ceaScale === 'log';

    AppState.charts.cea = new window.Chart(ceaCtx, {
      type: 'bar',
      data: {
        labels: ceaComparison.metrics,
        datasets: [
          {
            label: 'Open-Field Baseline',
            data: ceaComparison.field,
            backgroundColor: '#f59e0b',
            borderRadius: 4
          },
          {
            label: 'Hydroponics (CEA)',
            data: ceaComparison.hydroponic,
            backgroundColor: '#10b981',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toLocaleString()} (Field vs Hydroponic)`
            }
          }
        },
        scales: {
          y: {
            type: isLog ? 'logarithmic' : 'linear',
            grid: { color: 'rgba(51, 65, 85, 0.3)' },
            title: { display: true, text: isLog ? 'Logarithmic Scale (Values)' : 'Linear Scale', font: { size: 10 } }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  // ==========================================================
  // POLICY & DIPLOMACY SIMULATOR ENGINE
  // Formula: Leverage = Dependence * Non-Substitutability
  // ==========================================================

  function initSimulator() {
    const stockSlider = document.getElementById('slider-stock');
    const ceaSlider = document.getElementById('slider-cea');
    const fertSlider = document.getElementById('slider-fert');
    const originsSlider = document.getElementById('slider-origins');
    const solarSlider = document.getElementById('slider-solar');

    const stockLabel = document.getElementById('label-stock');
    const ceaLabel = document.getElementById('label-cea');
    const fertLabel = document.getElementById('label-fert');
    const originsLabel = document.getElementById('label-origins');
    const solarLabel = document.getElementById('label-solar');

    const scenarioButtons = document.querySelectorAll('.sim-scenario-btn');

    // Scenarios base configurations
    const scenarioConfigs = {
      hormuz: {
        name: '2026 Hormuz Closure',
        baseSeverity: 0.85,
        baseInflation: 36.0,
        basePopRisk: 22.5,
        baseEval: 'Active 2026 shock: ~20% of traded nitrogen and sulfur blocked. Without 90+ days buffer and supplier diversification, input costs escalate rapidly.'
      },
      blacksea: {
        name: 'Black Sea Grain Blockade',
        baseSeverity: 0.78,
        baseInflation: 31.0,
        basePopRisk: 20.0,
        baseEval: 'Wheat export restrictions from Black Sea hubs. Bread import bills skyrocket in Egypt, Lebanon, and Yemen unless alternative origins are contracted.'
      },
      cascade: {
        name: 'Cascading Export Bans',
        baseSeverity: 0.90,
        baseInflation: 42.0,
        basePopRisk: 29.0,
        baseEval: 'Over 17% of traded calories locked behind sudden unilateral export bans (as in 2022). High panic buying across food-importing developing states.'
      },
      climate: {
        name: 'Synchronous Climate Shock',
        baseSeverity: 0.95,
        baseInflation: 48.0,
        basePopRisk: 34.0,
        baseEval: 'Correlated heatwaves in India, Mediterranean, and North America. Water-scarce regions face immediate calorie shortages.'
      }
    };

    function recalculateSimulation() {
      const stock = parseInt(stockSlider.value, 10);
      const cea = parseInt(ceaSlider.value, 10);
      const fert = parseInt(fertSlider.value, 10);
      const origins = parseInt(originsSlider.value, 10);
      const solar = parseInt(solarSlider.value, 10);

      // Update Slider Labels
      if (stockLabel) stockLabel.textContent = `${stock} Days`;
      if (ceaLabel) ceaLabel.textContent = `${cea}% Fresh Produce`;
      if (fertLabel) fertLabel.textContent = `${fert}% Reduction`;
      if (originsLabel) originsLabel.textContent = `${origins} Origins`;
      if (solarLabel) solarLabel.textContent = `${solar}% Solar`;

      const cfg = scenarioConfigs[AppState.activeScenario] || scenarioConfigs.hormuz;

      // Mathematical Formulation:
      // Autonomy Index = (Buffer Coverage Factor) + (Origin Redundancy) + (CEA Localization) + (Fertilizer Efficiency) + (Solar Decoupling)
      // Buffer factor: target is 90-120 days (score up to 25 pts)
      const bufferFactor = Math.min(25, (stock / 120) * 25);
      
      // Origins factor: 1 origin = 5 pts, 2 = 10 pts, 3+ = 20-25 pts
      const originFactor = origins === 1 ? 5 : origins === 2 ? 12 : origins === 3 ? 20 : 25;

      // CEA factor: up to 20 pts
      const ceaFactor = (cea / 50) * 20;

      // Fertilizer factor: 15% gives 12 pts, up to 18 pts
      const fertFactor = (fert / 35) * 18;

      // Solar clean energy decoupling: up to 12 pts
      const solarFactor = (solar / 100) * 12;

      let autonomyScore = Math.round(bufferFactor + originFactor + ceaFactor + fertFactor + solarFactor);
      autonomyScore = Math.max(12, Math.min(95, autonomyScore));

      // Inverse: Coercive Vulnerability
      const vulnerabilityScore = 100 - autonomyScore;

      // Dynamic Inflation Shock calculation
      // baseInflation reduced by autonomy factor
      const inflationReduction = (autonomyScore / 100) * 0.65;
      const finalInflation = Math.max(4.2, (cfg.baseInflation * (1 - inflationReduction))).toFixed(1);

      // Population at Risk calculation
      const popRiskReduction = (autonomyScore / 100) * 0.70;
      const finalPopRisk = Math.max(2.1, (cfg.basePopRisk * (1 - popRiskReduction))).toFixed(1);

      // Water conserved (scaled by CEA share)
      const waterSaved = Math.round(cea * 11.5);

      // Fertilizer cut
      const fertCut = fert.toFixed(1);

      // Update DOM
      const scoreAutonomyEl = document.getElementById('score-autonomy');
      const barAutonomyEl = document.getElementById('bar-autonomy');
      const badgeVerdictEl = document.getElementById('sim-verdict-badge');
      const metricInflationEl = document.getElementById('metric-inflation');
      const metricPopEl = document.getElementById('metric-population');
      const metricWaterEl = document.getElementById('metric-water');
      const metricFertCutEl = document.getElementById('metric-fertcut');
      const evalTextEl = document.getElementById('sim-evaluation-text');

      if (scoreAutonomyEl) scoreAutonomyEl.textContent = `${autonomyScore} / 100`;
      if (barAutonomyEl) barAutonomyEl.style.width = `${autonomyScore}%`;

      if (metricInflationEl) metricInflationEl.textContent = `+${finalInflation}%`;
      if (metricPopEl) metricPopEl.textContent = `${finalPopRisk}M`;
      if (metricWaterEl) metricWaterEl.textContent = `${waterSaved}M m³`;
      if (metricFertCutEl) metricFertCutEl.textContent = `-${fertCut}%`;

      // Badge Styling
      if (badgeVerdictEl) {
        if (autonomyScore >= 70) {
          badgeVerdictEl.className = 'px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-800';
          badgeVerdictEl.textContent = 'High Strategic Resilience';
        } else if (autonomyScore >= 45) {
          badgeVerdictEl.className = 'px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-amber-950 text-amber-300 border border-amber-800';
          badgeVerdictEl.textContent = 'Moderate Vulnerability';
        } else {
          badgeVerdictEl.className = 'px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-rose-950 text-rose-300 border border-rose-800';
          badgeVerdictEl.textContent = 'Critical Coercion Risk';
        }
      }

      // Update Evaluation Narrative
      if (evalTextEl) {
        let advice = '';
        if (autonomyScore < 45) {
          advice = `Under the <strong>${cfg.name}</strong>, current buffer stocks of ${stock} days and low origin diversification (${origins} origins) expose the state to extreme coercive blackmail. Increase qualified origins to 3+ and buffer reserves to at least 90 days.`;
        } else if (autonomyScore < 70) {
          advice = `Resilience is moderate. Having ${origins} supplier origins and ${cea}% CEA fresh produce dampens the shock. To decouple further from Hormuz/fertilizer spikes, accelerate precision soil testing and expand solar farm microgrids.`;
        } else {
          advice = `<strong>Optimal Strategic Posture:</strong> With ${stock} days of reserves and ${origins} qualified supply channels, coercive leverage from external bans is largely neutralized. The state possesses strategic autonomy to weather a prolonged crisis into 2028.`;
        }
        evalTextEl.innerHTML = advice;
      }
    }

    // Attach listeners
    [stockSlider, ceaSlider, fertSlider, originsSlider, solarSlider].forEach(slider => {
      if (slider) slider.addEventListener('input', recalculateSimulation);
    });

    // Scenario buttons
    scenarioButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        scenarioButtons.forEach(b => {
          b.classList.remove('active', 'border-2', 'border-emerald-500/80', 'bg-slate-800');
          b.classList.add('bg-slate-950/80', 'border-slate-800');
        });
        btn.classList.add('active', 'border-2', 'border-emerald-500/80', 'bg-slate-800');
        btn.classList.remove('bg-slate-950/80', 'border-slate-800');

        AppState.activeScenario = btn.dataset.scenario;
        recalculateSimulation();
      });
    });

    // Apply Optimal Policy Button
    const btnApplyOptimal = document.getElementById('btn-apply-optimal');
    if (btnApplyOptimal) {
      btnApplyOptimal.addEventListener('click', () => {
        stockSlider.value = 110;
        ceaSlider.value = 35;
        fertSlider.value = 22;
        originsSlider.value = 4;
        solarSlider.value = 75;
        recalculateSimulation();
      });
    }

    // Reset Defaults
    const btnReset = document.getElementById('btn-reset-simulator');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        stockSlider.value = 45;
        ceaSlider.value = 12;
        fertSlider.value = 15;
        originsSlider.value = 2;
        solarSlider.value = 30;
        recalculateSimulation();
      });
    }

    // Run initial calculation
    recalculateSimulation();
  }

  // ==========================================================
  // DOCUMENT EXPLORER ENGINE
  // ==========================================================

  function initExplorer() {
    const container = document.getElementById('explorer-chapters-container');
    const searchInput = document.getElementById('explorer-search');
    const filterButtons = document.querySelectorAll('.doc-filter-btn');

    if (!container) return;

    function renderChapters(filterTopic = 'all', searchQuery = '') {
      container.innerHTML = '';

      const query = searchQuery.toLowerCase().trim();

      const filtered = chaptersData.filter(chapter => {
        const matchesTopic = filterTopic === 'all' || chapter.topics.includes(filterTopic);
        const matchesSearch = !query ||
          chapter.title.toLowerCase().includes(query) ||
          chapter.tag.toLowerCase().includes(query) ||
          chapter.content.toLowerCase().includes(query);
        return matchesTopic && matchesSearch;
      });

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="p-8 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            No sections match the current query or filter. Try clearing your search keyword.
          </div>
        `;
        return;
      }

      filtered.forEach((chapter, index) => {
        const card = document.createElement('div');
        card.className = 'bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all';
        
        card.innerHTML = `
          <div class="chapter-header p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-850/60 transition select-none">
            <div class="flex items-center gap-3.5">
              <span class="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                ${chapter.number}
              </span>
              <div>
                <h3 class="font-bold text-slate-100 text-sm tracking-tight">${chapter.title}</h3>
                <span class="text-[10px] text-slate-400 font-mono uppercase">${chapter.tag}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-400 p-1 rounded hover:bg-slate-800 toggle-icon">
                <i data-lucide="chevron-down" class="w-4 h-4"></i>
              </span>
            </div>
          </div>
          <div class="chapter-body px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4 hidden">
            ${chapter.content}
          </div>
        `;

        const header = card.querySelector('.chapter-header');
        const body = card.querySelector('.chapter-body');
        const icon = card.querySelector('.toggle-icon i');

        header.addEventListener('click', () => {
          const isHidden = body.classList.contains('hidden');
          body.classList.toggle('hidden', !isHidden);
          if (icon) {
            icon.setAttribute('data-lucide', isHidden ? 'chevron-up' : 'chevron-down');
            if (window.lucide) window.lucide.createIcons();
          }
        });

        // Open first chapter by default
        if (index === 0 && !query) {
          body.classList.remove('hidden');
        }

        container.appendChild(card);
      });

      if (window.lucide) window.lucide.createIcons();
    }

    // Attach search event
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const activeBtn = document.querySelector('.doc-filter-btn.active');
        const currentFilter = activeBtn ? activeBtn.dataset.filter : 'all';
        renderChapters(currentFilter, e.target.value);
      });
    }

    // Attach topic filters
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => {
          b.classList.remove('bg-emerald-600', 'text-white', 'active');
          b.classList.add('bg-slate-900', 'text-slate-300');
        });
        btn.classList.add('bg-emerald-600', 'text-white', 'active');
        btn.classList.remove('bg-slate-900', 'text-slate-300');

        const filter = btn.dataset.filter;
        renderChapters(filter, searchInput ? searchInput.value : '');
      });
    });

    // Initial render
    renderChapters('all', '');
  }

  // ==========================================================
  // BOOTSTRAP APP
  // ==========================================================
  initTabs();
  initMobileNav();
  initModal();
  initMap();
  initCharts();
  initSimulator();
  initExplorer();
});
