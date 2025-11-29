import React from "react";
import { Message } from "@/types/simulation";

export default function PipePanel({ pipeStates }: { pipeStates: Message[] }) {
  const image_size = 15_000_000_000 * 8;

  return (
    <></>
    // <div className="flex w-full h-full min-h-0">
    //   <div className="overflow-auto w-full h-full min-h-0">
    //     <table className="w-full h-full text-xs min-h-0">
    //       <thead className="bg-gray-07 text-white sticky top-0 z-10">
    //         <tr>
    //           <th className="px-2 py-1">ID</th>
    //           <th className="px-2 py-1">Sender</th>
    //           <th className="px-2 py-1">Sender Type</th>
    //           <th className="px-2 py-1">Receiver</th>
    //           <th className="px-2 py-1">Receiver Type</th>
    //           <th className="px-2 py-1">Type</th>
    //           <th className="px-2 py-1">Size</th>
    //           <th className="px-2 py-1">Target ID</th>
    //           <th className="px-2 py-1">Target Loc</th>
    //           <th className="px-2 py-1">Target Len</th>
    //           <th className="px-2 py-1">Timestamp</th>
    //           <th className="px-2 py-1">Status</th>
    //         </tr>
    //       </thead>
    //       <tbody>
    //         {pipeStates.map((msg, idx) => (
    //           <tr key={idx} className="hover:bg-white/5">
    //             <td className="px-2 py-1">{msg.id?.slice(-6)}</td>
    //             <td className="px-2 py-1">{msg.sender?.slice(-6)}</td>
    //             <td className="px-2 py-1">{msg.senderType}</td>
    //             <td className="px-2 py-1">
    //               {msg.receiver != "" && msg.receiver ? msg.receiver.slice(-6) : "Auto"}
    //             </td>
    //             <td className="px-2 py-1">
    //               {msg.receiverType != "" ? msg.receiverType : "Auto"}
    //             </td>
    //             <td className="px-2 py-1">{msg.type}</td>
    //             <td className="px-2 py-1">
    //               {msg.type === 2
    //                 ? (msg.size / (0.5 * image_size)).toFixed(8)
    //                 : (msg.size / image_size).toFixed(8)}
    //             </td>
    //             <td className="px-2 py-1">{msg.targetId?.slice(-6) ?? "--"}</td>
    //             <td className="px-2 py-1">
    //               {msg.targetLoc
    //                 ? `Lat: ${msg.targetLoc.lat.toFixed(
    //                     2
    //                   )}, Lon: ${msg.targetLoc.lon.toFixed(2)}`
    //                 : "--"}
    //             </td>
    //             <td className="px-2 py-1">{msg.targetLen ?? "--"} m</td>
    //             <td className="px-2 py-1">{msg.ts}</td>
    //             <td className="px-2 py-1">{msg.status}</td>
    //           </tr>
    //         ))}
    //       </tbody>
    //     </table>
    //   </div>
    // </div>
  );
}
