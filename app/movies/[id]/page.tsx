import { MovieDetail } from "@/components/movie-detail"

export default function MovieDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-6">
      <MovieDetail movieId={params.id} />
    </div>
  )
} 