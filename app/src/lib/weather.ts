// Weather lookup via OpenWeather. Server-only.

export type Weather = {
  temp_c: number;
  condition: string; // "rainy" | "sunny" | "cloudy" | "snow" | "wind" | etc.
  description: string; // human-readable
  city: string;
};

type OpenWeatherResponse = {
  main: { temp: number };
  weather: { main: string; description: string }[];
  wind: { speed: number };
  name: string;
};

function normaliseCondition(main: string, windSpeed: number): string {
  const m = main.toLowerCase();
  if (m.includes("rain") || m.includes("drizzle") || m.includes("thunder"))
    return "rainy";
  if (m.includes("snow")) return "snow";
  if (windSpeed > 8) return "wind";
  if (m.includes("clear")) return "sunny";
  if (m.includes("cloud")) return "cloudy";
  if (m.includes("mist") || m.includes("fog") || m.includes("haze"))
    return "cloudy";
  return main.toLowerCase();
}

export async function getWeather(): Promise<Weather> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const lat = process.env.DEFAULT_LOCATION_LAT ?? "52.3007";
  const lng = process.env.DEFAULT_LOCATION_LNG ?? "4.8636";
  const cityName = process.env.DEFAULT_LOCATION_NAME ?? "Amstelveen";

  if (!apiKey) {
    // Fallback for local dev without a key — typical UK conditions
    return {
      temp_c: 12,
      condition: "cloudy",
      description: "cloudy 12°C",
      city: cityName,
    };
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 600 }, // cache for 10 min
    });
    if (!res.ok) throw new Error(`OpenWeather ${res.status}`);
    const data: OpenWeatherResponse = await res.json();

    const condition = normaliseCondition(
      data.weather[0]?.main ?? "",
      data.wind?.speed ?? 0
    );

    return {
      temp_c: Math.round(data.main.temp),
      condition,
      description: `${data.weather[0]?.description ?? condition}, ${Math.round(
        data.main.temp
      )}°C`,
      city: data.name || cityName,
    };
  } catch (err) {
    console.error("Weather fetch failed:", err);
    return {
      temp_c: 12,
      condition: "cloudy",
      description: "cloudy 12°C (estimated)",
      city: cityName,
    };
  }
}
