import { SeriesDetail } from "@/components/series-detail"

export default function SeriesDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-6">
      <SeriesDetail id={params.id} />
    </div>
  )
}

