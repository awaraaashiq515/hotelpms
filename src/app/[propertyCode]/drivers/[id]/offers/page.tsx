import DriverJourneyClient from "./DriverJourneyClient";

export default function DriverJourneyPage({ params }: { params: Promise<{ id: string }> }) {
  return <DriverJourneyClient params={params} />;
}
