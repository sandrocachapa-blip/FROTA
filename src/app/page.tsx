import { FleetApp } from "@/components/fleet/fleet-app";
import { getFleetData } from "@/lib/db/queries";

export default async function Home() {
  const data = await getFleetData();
  return <FleetApp initialData={data} />;
}
