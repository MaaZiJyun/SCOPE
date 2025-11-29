
// import { Row } from "@influxdata/influxdb-client"; // or your own row type

// export function parseInfluxRowToRealTime(row: InfluxRealTimeRow): RealTime {
//   return {
//     id: row.id,
//     userId: row.userId,
//     projectId: row.projectId,
//     constellationId: row.constellationId,
//     time: new Date(row._time),
//     timeSlot: parseInt(row.timeSlot),
//     satData: JSON.parse(row.satData),
//     gsData: JSON.parse(row.gsData),
//     imgData: JSON.parse(row.imgData),
//     roiData: JSON.parse(row.roiData),
//     linkData: JSON.parse(row.linkData),
//     sunPos: JSON.parse(row.sunPos),
//     earthRotation: parseFloat(row.earthRotation),
//     moonPos: row.moonPos ? JSON.parse(row.moonPos) : undefined,
//     moonRotation: row.moonRotation ? parseFloat(row.moonRotation) : undefined,
//     zeroPos: row.zeroPos ? JSON.parse(row.zeroPos) : undefined,
//     createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
//     updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
//   };
// }

// interface InfluxRealTimeRow {
//   _time: string;
//   id: string;
//   userId: string;
//   projectId: string;
//   constellationId: string;
//   timeSlot: string;
//   satData: string;
//   gsData: string;
//   imgData: string;
//   roiData: string;
//   linkData: string;
//   sunPos: string;
//   earthRotation: string;
//   moonPos?: string;
//   moonRotation?: string;
//   zeroPos?: string;
//   createdAt?: string;
//   updatedAt?: string;
// }
