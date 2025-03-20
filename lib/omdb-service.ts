const OMDB_API_KEY = process.env.NEXT_PUBLIC_OMDB_API_KEY || "sua_api_key"; // Substituir pela sua chave API

/**
 * Busca filmes/séries pelo título na API do OMDB
 */
export async function searchOMDbByTitle(title: string) {
  const response = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(title)}`);
  
  if (!response.ok) {
    throw new Error(`Falha na busca: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Busca detalhes de um filme/série pelo ID do IMDB
 */
export async function getOMDbDetailsById(imdbId: string) {
  const response = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${imdbId}&plot=full`);
  
  if (!response.ok) {
    throw new Error(`Falha ao buscar detalhes: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Busca detalhes de uma temporada de série
 */
export async function getOMDbSeasonDetails(imdbId: string, season: number) {
  const response = await fetch(
    `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${imdbId}&Season=${season}`
  );
  
  if (!response.ok) {
    throw new Error(`Falha ao buscar detalhes da temporada: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Busca detalhes de um episódio específico
 */
export async function getOMDbEpisodeDetails(imdbId: string, season: number, episode: number) {
  const response = await fetch(
    `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${imdbId}&Season=${season}&Episode=${episode}`
  );
  
  if (!response.ok) {
    throw new Error(`Falha ao buscar detalhes do episódio: ${response.statusText}`);
  }
  
  return await response.json();
} 