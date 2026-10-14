import { GROUPS_DATA } from "../groupsData";

export interface CuotaRecord {
  no: number;
  rfc: string;
  razonSocial: string;
  cuota: number;
  notas?: string;
  grupo?: string;
}

export const CUOTAS_RECORDS: CuotaRecord[] = [
  { no: 1, rfc: "AAU880906KR2", razonSocial: "ALICA AUTOMOTRIZ S.A. DE C.V.", cuota: 100760, grupo: "ALICA" },
  { no: 2, rfc: "ACC851025FJ4", razonSocial: "AUTO CENTRO DE CELAYA S.A. DE C.V.", cuota: 169620, grupo: "AUTO CENTRO" },
  { no: 3, rfc: "ADC830720NB8", razonSocial: "AUTO DISTRIBUIDORES DEL CENTRO", cuota: 0, notas: "Cerrada", grupo: "AUTO DISTRIBUIDORES" },
  { no: 4, rfc: "ANX0210315DA", razonSocial: "AUTO NORD S.A.DE C.V.", cuota: 48180, grupo: "CEVER" },
  { no: 5, rfc: "APB031125DF0", razonSocial: "AUTO PRODUCTOS BAJA S.A. DE C.V.", cuota: 94380, grupo: "AUTO PRODUCTOS" },
  { no: 6, rfc: "APC031125A4A", razonSocial: "AUTO PRODUCTOS DE LA COSTA S.A. DE C.V.", cuota: 119020, grupo: "AUTO PRODUCTOS" },
  { no: 7, rfc: "AUT991215UZ2", razonSocial: "AUTOANGAR S.A. DE C.V.", cuota: 183920, grupo: "ANDRADE" },
  { no: 8, rfc: "ACC830518A50", razonSocial: "AUTO CAMIONES DE CHIHUAHUA S.A. DE C.V.", cuota: 133260, grupo: "CLEBER" },
  { no: 9, rfc: "AUT810524NEA", razonSocial: "AUTOMAYA S.A. DE C.V.", cuota: 202620, grupo: "CER" },
  { no: 10, rfc: "AAN000811P96", razonSocial: "AUTOMOTORES ANTEQUERA S.A. DE C.V.", cuota: 240460, grupo: "FARRERA" },
  { no: 11, rfc: "ALE810603KC4", razonSocial: "AUTOMOTORES DE LEON S.A. DE C.V.", cuota: 132820, grupo: "PIOMIKRON" },
  { no: 12, rfc: "AME6907306R3", razonSocial: "AUTOMOTORES DE MEXICO S.A. DE C.V.", cuota: 248600, grupo: "AUTOMOTORES DE MEXICO" },
  { no: 13, rfc: "AFL9904294P2", razonSocial: "AUTOMOTORES FLOSOL S.A. DE C.V.", cuota: 162140, grupo: "FLOSOL" },
  { no: 14, rfc: "AGH140207HC8", razonSocial: "AUTOMOTORES GALOS DE HERMOSILLO", cuota: 0, notas: "Cerrada", grupo: "AUTOMOTORES GALOS" },
  { no: 15, rfc: "ASO890921LZ1", razonSocial: "AUTOMOTORES PEDREGAL S.A. DE C.V.", cuota: 223300, grupo: "SONI" },
  { no: 16, rfc: "ACA880718N21", razonSocial: "AUTOMOTRIZ CAMPA S.A. DE C.V.", cuota: 159280, grupo: "CAMPA" },
  { no: 17, rfc: "ACA820322RA6", razonSocial: "AUTOMOTRIZ CARIBE S.A. DE C.V.", cuota: 161480, grupo: "CER" },
  { no: 18, rfc: "ADU811129I31", razonSocial: "AUTOMOTRIZ DE DURANGO S.A. DE C.V.", cuota: 59400, grupo: "ARTEC" },
  { no: 19, rfc: "ASA820101VD3", razonSocial: "AUTOMOTRIZ DE SABINAS S.A. DE C.V.", cuota: 21120, grupo: "SABINAS" },
  { no: 20, rfc: "ALA821201DE1", razonSocial: "AUTOMOTRIZ LAGUNERA S.A. DE C.V.", cuota: 169840, grupo: "VALMUR" },
  { no: 21, rfc: "ASO870130362", razonSocial: "AUTOMOTRIZ SONORENSE S.A. DE C.V.", cuota: 40480, grupo: "SONORENSE" },
  { no: 22, rfc: "ATA6202284E4", razonSocial: "AUTOMOTRIZ TAMAULIPAS S.A. DE C.V.", cuota: 76780, grupo: "AUTOMOTRIZ TAMAULIPAS" },
  { no: 23, rfc: "ACZ191018PP5", razonSocial: "AUTOMOVILES CGE DE ZACATECAS S.A. DE C.V.", cuota: 1989820, grupo: "MH AUTOMOTRIZ" },
  { no: 24, rfc: "ABC060707AN9", razonSocial: "AUTOMOVILES DEL BAJIO CAMPESTRE S.A. DE C.V.", cuota: 156640, grupo: "PIOMIKRON" },
  { no: 25, rfc: "AVI1810105G0", razonSocial: "AUTOMOVILES KASA VIADUCTO S.A. DE C.V.", cuota: 587840, grupo: "KASA" },
  { no: 26, rfc: "APS220301C15", razonSocial: "AUTOMOVILES PRO SNOP DE QUERETARO S.A. DE C.V.", cuota: 160380, grupo: "AUTOMOTORES QUERETARO" },
  { no: 27, rfc: "ACA3511251Z5", razonSocial: "AUTOMOVILES Y CAMIONES S.A. DE C.V.", cuota: 76060, grupo: "AYCSA" },
  { no: 28, rfc: "AUT661101NZ5", razonSocial: "AUTOMUNDO S.A. DE C.V.", cuota: 216700, grupo: "AUTOMUNDO" },
  { no: 29, rfc: "AOR230529I46", razonSocial: "AUTOPOLIS ORIENTAL S.A. DE C.V.", cuota: 30140, grupo: "AUTOPOLIS" },
  { no: 30, rfc: "AUT980924GQ4", razonSocial: "AUTOPOLANCO", cuota: 0, notas: "Cerrada", grupo: "AUTOPOLANCO" },
  { no: 31, rfc: "ANO8509243H3", razonSocial: "AUTOS DEL NORTE S.A. DE C.V.", cuota: 47300, grupo: "AUTOS DEL NORTE" },
  { no: 32, rfc: "AEP98032314A", razonSocial: "AUTOS ELEGANTES DE PACHUCA S.A. DE C.V.", cuota: 190520, grupo: "AUTOFIN" },
  { no: 33, rfc: "AFI160902SR2", razonSocial: "AUTOS FINOS DE IRAPUATO S.A. DE C.V.", cuota: 138820, grupo: "PIOMIKRON" },
  { no: 34, rfc: "AMO560328EA1", razonSocial: "AUTOS MONCLOVA S.A. DE C.V.", cuota: 54560, grupo: "MONCLOVA" },
  { no: 35, rfc: "ACS881003212", razonSocial: "AUTOS Y CAMIONES SOL DE MICHOACAN S.A. DE C.V.", cuota: 162360, grupo: "AUTOS Y CAMIONES SOL" },
  { no: 36, rfc: "ATS821207IE3", razonSocial: "AUTOS Y TRACTORES DE SINALOA S.A. DE C.V.", cuota: 71720, grupo: "BOURS" },
  { no: 37, rfc: "BDM1703308Y9", razonSocial: "BC DESERTICA MOTORS S.A. DE C.V.", cuota: 167420, grupo: "SURMAN" },
  { no: 38, rfc: "CAU8804072Y0", razonSocial: "CABORCA AUTOMOTRIZ S.A. DE C.V.", cuota: 80960, grupo: "CABORCA" },
  { no: 39, rfc: "CAO850307HY1", razonSocial: "CAMARENA AUTOMOTRIZ DE OCCIDENTE S.A. DE C.V.", cuota: 269940, grupo: "CAMARENA" },
  { no: 40, rfc: "CAU0209118S4", razonSocial: "CAMBREV AUTOMOTRIZ S.A. DE C.V.", cuota: 123080, grupo: "PASA" },
  { no: 41, rfc: "COM021025A18", razonSocial: "CAR ONE MONTERREY S.A. DE C.V.", cuota: 581900, grupo: "CAR ONE" },
  { no: 42, rfc: "CAT2408308D1", razonSocial: "CEIR & TRUCKS S.A. DE C.V.", cuota: 27720, grupo: "CEIR & TRUCKS" },
  { no: 43, rfc: "CAS8908282F3", razonSocial: "CHETUMAL AUTOMOTORES S.A. DE C.V.", cuota: 59840, grupo: "CER" },
  { no: 44, rfc: "CMO500807H41", razonSocial: "COAHUILA MOTORS S.A. DE C.V.", cuota: 117260, grupo: "COAHUILA MOTORS" },
  { no: 45, rfc: "CAP940617L89", razonSocial: "COMERCIAL AUTOMOTRIZ DE POZA RICA S.A. DE C.V.", cuota: 111760, grupo: "CAR ONE DEL GOLFO" },
  { no: 46, rfc: "CAU8610017F5", razonSocial: "CONTINENTAL AUTOMOTRIZ S.A. DE C.V.", cuota: 315260, grupo: "CONTINENTAL" },
  { no: 47, rfc: "CAU820422G5A", razonSocial: "CUERNAVACA AUTOMOTRIZ S.A. DE C.V.", cuota: 207900, grupo: "SONI" },
  { no: 48, rfc: "DFA851015CD3", razonSocial: "DF AUTOMOTRIZ S.A. DE C.V.", cuota: 99880, grupo: "DF AUTOMOTRIZ" },
  { no: 49, rfc: "DCO030129L75", razonSocial: "DIEZ CORDOBA S.A. DE C.V.", cuota: 142340, grupo: "DIEZ" },
  { no: 50, rfc: "DCO850401LWA", razonSocial: "DIEZ DE COATZACOALCOS S.A. DE C.V.", cuota: 183260, grupo: "DIEZ" },
  { no: 51, rfc: "DOR940101587", razonSocial: "DIEZ ORIZABA S.A. DE C.V.", cuota: 131780, grupo: "DIEZ" },
  { no: 52, rfc: "DVE060914I70", razonSocial: "DIEZ VERACRUZ S.A. DE C.V.", cuota: 201080, grupo: "DIEZ" },
  { no: 53, rfc: "DAC7205171M0", razonSocial: "DISTRIBUIDORA DE ACAPULCO S.A. DE C.V.", cuota: 169620, grupo: "ACAPULCO" },
  { no: 54, rfc: "ECO070817V28", razonSocial: "ECOBIKE S.A. DE C.V.", cuota: 141240, grupo: "PIOMIKRON" },
  { no: 55, rfc: "ESU1002265Q6", razonSocial: "EURO SURMAN S.A. DE C.V.", cuota: 56760, grupo: "SURMAN" },
  { no: 56, rfc: "EAU010109GG0", razonSocial: "EUROFRANCE AUTOS S.A. DE C.V.", cuota: 134200, grupo: "HERRERA" },
  { no: 57, rfc: "EBA150311DL7", razonSocial: "EUROSTAR BAJIO S.A. DE C.V.", cuota: 79420, grupo: "GSAU" },
  { no: 58, rfc: "ETE120706JY5", razonSocial: "EUROSURMAN TEC S.A. DE C.V.", cuota: 39600, grupo: "SURMAN" },
  { no: 59, rfc: "EUR011112CY9", razonSocial: "EUROVALLE S.A. DE C.V.", cuota: 78100, grupo: "FR AUTOMOTRIZ" },
  { no: 60, rfc: "FAU0207021I4", razonSocial: "FAME AUTOMOTRIZS.A. DE C.V.", cuota: 196020, grupo: "FAME" },
  { no: 61, rfc: "FMC150827M67", razonSocial: "FLOSOL MOTORS COLIMA S.A. DE C.V.", cuota: 56100, grupo: "FLOSOL" },
  { no: 62, rfc: "GAL040716BTA", razonSocial: "GALOJAL S. DE R.L. DE C.V.", cuota: 110220, grupo: "GALOJAL" },
  { no: 63, rfc: "GPR1601017M4", razonSocial: "GEMA PREMIER S.A. DE C.V.", cuota: 235400, grupo: "GEMA" },
  { no: 64, rfc: "GRA880621E6A", razonSocial: "GONZALEZ R AUTOMOTRIZ", cuota: 0, notas: "Cerrada", grupo: "GONZALEZ R" },
  { no: 65, rfc: "GAU1107115P4", razonSocial: "GRUMARMEX AUTOS S.A. DE C.V.", cuota: 85580, grupo: "GRUPO MARIN" },
  { no: 66, rfc: "GMC090921JI8", razonSocial: "GRUPO MOTORMEXA COLIMA S.A. DE C.V.", cuota: 53900, grupo: "MOTORMEXA" },
  { no: 67, rfc: "GMG090821RT0", razonSocial: "GRUPO MOTORMEXA GUADALAJARA S.A. DE C.V.", cuota: 356840, grupo: "MOTORMEXA" },
  { no: 68, rfc: "GSP21032694A", razonSocial: "GRUPO STELLA DE PUEBLA S.A. DE C.V.", cuota: 487520, grupo: "STELLA DE PUEBLA" },
  { no: 69, rfc: "GPR831122Q21", razonSocial: "GUILLERMO PRIETO Y COMPAÑÍA S.A. DE C.V.", cuota: 51920, grupo: "GEPRI" },
  { no: 70, rfc: "IMA011213626", razonSocial: "INTERLOMAS MUNDO AUTOMOTRIZ S.A. DE C.V.", cuota: 235180, grupo: "AUTOMUNDO" },
  { no: 71, rfc: "LMO0201227A3", razonSocial: "LYON MOTORS S.A. DE C.V.", cuota: 75460, grupo: "SURMAN" },
  { no: 72, rfc: "MEG970811KB7", razonSocial: "MEGAMOTORS S.A. DE C.V.", cuota: 298980, grupo: "REFRAN" },
  { no: 73, rfc: "MER9806056K3", razonSocial: "MERIDIEN S.A. DE C.V.", cuota: 113680, grupo: "DICAS" },
  { no: 74, rfc: "MMO870107DB3", razonSocial: "MICHOACAN MOTORS S.A. DE C.V.", cuota: 168300, grupo: "MICHOACAN MOTORS" },
  { no: 75, rfc: "MAU910926MV2", razonSocial: "MIRADOR AUTOMOTRIZ S.A. DE C.V.", cuota: 224840, grupo: "BICHARA" },
  { no: 76, rfc: "MAU89021583A", razonSocial: "MISOL AUTOMOTRIZ S.A. DE C.V.", cuota: 174680, grupo: "MISOL" },
  { no: 77, rfc: "NAT931028GI3", razonSocial: "NUEVA AUTOMOTRIZ DEL TORO S.A. DE C.V.", cuota: 78320, grupo: "PLASENCIA" },
  { no: 78, rfc: "PAU981125RRA", razonSocial: "PALMAS AUTOMOTRIZ S.A. DE C.V.", cuota: 78980, grupo: "PALMAS" },
  { no: 79, rfc: "PAU060628U33", razonSocial: "PREMIER AUTOCOUNTRY S.A. DE C.V.", cuota: 140800, grupo: "PREMIER" },
  { no: 80, rfc: "PMO180312V94", razonSocial: "PRESTIGIO MOTRIZ S.A. DE C.V.", cuota: 264880, grupo: "PRESTIGIO MOTRIZ" },
  { no: 81, rfc: "RLA1107191G4", razonSocial: "REFRAN AUTOS S. DE R.L. DE C.V.", cuota: 520080, grupo: "REFRAN" },
  { no: 82, rfc: "RAV9207275N0", razonSocial: "ROCA AUTOMOTRIZ VALLARTA S.A. DE C.V.", cuota: 113740, grupo: "ROCA" },
  { no: 83, rfc: "SXA8402011W4", razonSocial: "SABALO DE XALAPA S.A. DE C.V.", cuota: 193600, grupo: "SABALO" },
  { no: 84, rfc: "SAC970729FY9", razonSocial: "SONORA AUTOMOTRIZ DE CABORCA S.A. DE C.V.", cuota: 179080, grupo: "GRAN AUTO" },
  { no: 85, rfc: "SAU1702229P7", razonSocial: "STELLA AUTOMOTRIZ S.A. DE C.V.", cuota: 170720, grupo: "SADO" },
  { no: 86, rfc: "SMO2510318Z6", razonSocial: "STELLA MOTORS S.A. DE C.V.", cuota: 202620, grupo: "MENA" },
  { no: 87, rfc: "TAU811202HN9", razonSocial: "TORRES AUTOMOTRIZ S.A. DE C.V.", cuota: 50160, grupo: "TORRES AUTOMOTRIZ" },
  { no: 88, rfc: "TMO750301MX3", razonSocial: "TOUCHE MOTORS S.A. DE C.V.", cuota: 124740, grupo: "TOXA" },
  { no: 89, rfc: "VEG1206276F5", razonSocial: "VEHICULOS EUROPEOS DE GUADALAJARA S.A. DE C.V.", cuota: 168080, grupo: "PLASENCIA" },
];

export interface CuotasGroupResult {
  groupName: string;
  total: number;
  items: Array<{
    no: number;
    rfc: string;
    razonSocial: string;
    cuota: number;
    notas?: string;
  }>;
}

export interface CuotaRazonSocialResult {
  razonSocial: string;
  rfc?: string;
  cuota: number;
  grupo?: string;
  found: boolean;
}

// Normalizer to compare strings smoothly
function normalizeAgency(str: string): string {
  return (str || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

function cleanLegalSuffix(str: string): string {
  return (str || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(S\.?A\.?(\s*DE\s*C\.?V\.?)?|S\.? DE R\.?L\.?(\s*DE\s*C\.?V\.?)?|S\.?A\.?P\.?I\.?(\s*DE\s*C\.?V\.?)?|I\.?A\.?P\.?)\b/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

/**
 * Calculates the available cuota balance for a specific razón social / distribuidora.
 */
export function getCuotaSaldoForRazonSocial(razonSocial: string, groupName?: string): CuotaRazonSocialResult {
  const rsClean = (razonSocial || "").trim();
  const gClean = (groupName || "").trim();

  if (!rsClean && !gClean) {
    return { razonSocial: "", cuota: 0, found: false };
  }

  const rsNorm = cleanLegalSuffix(rsClean);
  const gNorm = normalizeAgency(gClean);

  // 1. Direct or normalized match on CUOTAS_RECORDS.razonSocial
  if (rsNorm) {
    const directMatch = CUOTAS_RECORDS.find(r => cleanLegalSuffix(r.razonSocial) === rsNorm);
    if (directMatch) {
      return {
        razonSocial: directMatch.razonSocial,
        rfc: directMatch.rfc,
        cuota: directMatch.cuota,
        grupo: directMatch.grupo,
        found: true
      };
    }
  }

  // 2. Match within the group if groupName provided
  if (gClean) {
    const groupRecords = CUOTAS_RECORDS.filter(r => normalizeAgency(r.grupo || "") === gNorm);
    if (groupRecords.length === 1) {
      return {
        razonSocial: rsClean || groupRecords[0].razonSocial,
        rfc: groupRecords[0].rfc,
        cuota: groupRecords[0].cuota,
        grupo: groupRecords[0].grupo,
        found: true
      };
    }

    if (groupRecords.length > 1 && rsNorm) {
      const matchInGroup = groupRecords.find(r => {
        const rNorm = cleanLegalSuffix(r.razonSocial);
        return rNorm === rsNorm || rNorm.includes(rsNorm) || rsNorm.includes(rNorm);
      });
      if (matchInGroup) {
        return {
          razonSocial: matchInGroup.razonSocial,
          rfc: matchInGroup.rfc,
          cuota: matchInGroup.cuota,
          grupo: matchInGroup.grupo,
          found: true
        };
      }
    }
  }

  // 3. Partial substring match across all CUOTAS_RECORDS
  if (rsNorm) {
    const partialMatch = CUOTAS_RECORDS.find(r => {
      const rNorm = cleanLegalSuffix(r.razonSocial);
      return rNorm.includes(rsNorm) || rsNorm.includes(rNorm);
    });
    if (partialMatch) {
      return {
        razonSocial: partialMatch.razonSocial,
        rfc: partialMatch.rfc,
        cuota: partialMatch.cuota,
        grupo: partialMatch.grupo,
        found: true
      };
    }
  }

  return {
    razonSocial: rsClean,
    cuota: 0,
    grupo: gClean,
    found: false
  };
}

/**
 * Calculates the available cuotas balance for a specific group.
 * Matches by group name and/or associated razones sociales.
 */
export function getCuotasSaldoForGroup(groupName: string): CuotasGroupResult {
  const gClean = (groupName || "").trim();
  const gNorm = normalizeAgency(gClean);

  if (!gNorm) {
    return { groupName: gClean, total: 0, items: [] };
  }

  // 1. First find records matching this group directly
  let matchedRecords = CUOTAS_RECORDS.filter(record => {
    const recordGroupNorm = normalizeAgency(record.grupo || "");
    return recordGroupNorm === gNorm;
  });

  // 2. If no direct group match, find by matching agencies from GROUPS_DATA
  if (matchedRecords.length === 0) {
    const groupKey = Object.keys(GROUPS_DATA).find(k => normalizeAgency(k) === gNorm);
    const groupAgencies = groupKey && GROUPS_DATA[groupKey] ? GROUPS_DATA[groupKey] : [];

    if (groupAgencies.length > 0) {
      const normAgencies = groupAgencies.map(normalizeAgency);
      matchedRecords = CUOTAS_RECORDS.filter(record => {
        const rNorm = normalizeAgency(record.razonSocial);
        return normAgencies.some(na => na === rNorm || na.includes(rNorm) || rNorm.includes(na));
      });
    }
  }

  const total = matchedRecords.reduce((acc, curr) => acc + curr.cuota, 0);

  return {
    groupName: gClean,
    total,
    items: matchedRecords
  };
}

/**
 * Formats monetary amounts in Mexican Pesos ($ X,XXX.XX MXN)
 */
export function formatCuotaCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(amount || 0)) + " MXN";
}
