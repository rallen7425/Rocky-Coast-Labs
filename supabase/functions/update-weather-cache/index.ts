// Populates village_summer.weather_cache with real weather + tide data for
// Summer Village (Wells, ME). Run on a schedule by pg_cron — see the
// accompanying migration. Previously this table was never populated and
// the app showed hardcoded placeholder values.
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Closest official stations to Wells, ME with free, no-key-required APIs.
const NWS_STATION = 'KSFM'        // Sanford Regional Airport (NWS observations)
const NOAA_TIDE_STATION = '8419317' // Wells, Webhannet River (NOAA CO-OPS predictions)
const USER_AGENT = 'summer-village-life (rallen7425@gmail.com)'

function cToF(c: number): number {
  return Math.round((c * 9) / 5 + 32)
}

function kmhToMph(kmh: number): number {
  return Math.round(kmh * 0.621371)
}

function beachStatus(windMph: number, description: string): 'Ideal' | 'Fair' | 'Poor' {
  const adverse = /rain|storm|thunder|snow|fog/i.test(description)
  if (adverse || windMph > 20) return 'Poor'
  if (windMph > 12 || /cloud|overcast/i.test(description)) return 'Fair'
  return 'Ideal'
}

interface NwsObservation {
  properties: {
    temperature: { value: number | null }
    heatIndex: { value: number | null }
    windChill: { value: number | null }
    windSpeed: { value: number | null }
    textDescription: string | null
  }
}

interface NoaaPrediction {
  t: string // "YYYY-MM-DD HH:MM" in GMT
  type: 'H' | 'L'
}

Deno.serve(async () => {
  const [obsRes, tideRes] = await Promise.all([
    fetch(`https://api.weather.gov/stations/${NWS_STATION}/observations/latest`, {
      headers: { 'User-Agent': USER_AGENT },
    }),
    fetch(
      `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&application=summer_village_life&date=today&range=48&datum=MLLW&station=${NOAA_TIDE_STATION}&time_zone=gmt&units=english&interval=hilo&format=json`,
    ),
  ])

  if (!obsRes.ok || !tideRes.ok) {
    return new Response(JSON.stringify({ error: 'upstream weather/tide fetch failed' }), { status: 502 })
  }

  const obs = (await obsRes.json()) as NwsObservation
  const tide = (await tideRes.json()) as { predictions?: NoaaPrediction[] }

  const p = obs.properties
  const tempF = p.temperature.value != null ? cToF(p.temperature.value) : null
  const apparentC = p.heatIndex.value ?? p.windChill.value ?? p.temperature.value
  const feelsLikeF = apparentC != null ? cToF(apparentC) : null
  const windMph = p.windSpeed.value != null ? kmhToMph(p.windSpeed.value) : 0
  const description = p.textDescription ?? ''

  const now = new Date()
  const nextTide = (tide.predictions ?? [])
    .map(t => ({ at: new Date(`${t.t.replace(' ', 'T')}Z`), type: t.type === 'H' ? 'High' : 'Low' }))
    .find(t => t.at > now)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { db: { schema: 'village_summer' } },
  )

  const { error } = await supabase.from('weather_cache').insert({
    temp_f: tempF,
    feels_like_f: feelsLikeF,
    wind_mph: windMph,
    beach_status: beachStatus(windMph, description),
    next_tide_at: nextTide?.at.toISOString() ?? null,
    next_tide_type: nextTide?.type ?? null,
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(
    JSON.stringify({ ok: true, temp_f: tempF, feels_like_f: feelsLikeF, wind_mph: windMph }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
