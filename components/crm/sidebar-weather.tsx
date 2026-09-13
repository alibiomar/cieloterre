"use client";

import { useEffect, useState } from "react";
import { MapPin, Thermometer, Wind } from "lucide-react";

type Location = { latitude: number; longitude: number; city: string };
type WeatherResponse = { current?: { temperature_2m: number; wind_speed_10m: number } };

export function SidebarWeather() {
  const [location, setLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;

            // Try to get city name using reverse geocoding
            try {
              const geoResponse = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=fr`,
              );
              const geoData = await geoResponse.json();

              setLocation({
                latitude,
                longitude,
                city: geoData.city || geoData.locality || "Votre ville",
              });
            } catch {
              setLocation({ latitude, longitude, city: "Votre ville" });
            }

            setLocationError(false);
          },
          (error) => {
            console.error("Error getting location:", error);
            // Fallback to default location (Tunis)
            setLocation({
              latitude: 36.8065,
              longitude: 10.1815,
              city: "Tunis",
            });
            setLocationError(true);
          },
        );
      } else {
        // Geolocation not supported, use default
        setLocation({
          latitude: 36.8065,
          longitude: 10.1815,
          city: "Tunis",
        });
        setLocationError(true);
      }
    };

    getLocation();
  }, []);

  // Fetch weather data based on location
  useEffect(() => {
    if (!location) return;

    const fetchWeather = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,wind_speed_10m`,
        );
        const data = await response.json();
        setWeather(data);
      } catch (error) {
        console.error("Error fetching weather:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [location]);

  return (
    <div className="rounded-xl bg-background/10 px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs text-primary-foreground/60">
        <MapPin size={13} />
        <span>{location?.city ?? "Localisation..."}</span>
        {locationError && <span className="text-primary-foreground/40">(par défaut)</span>}
      </div>
      {loading && !weather ? (
        <p className="mt-2 text-xs text-primary-foreground/40">Météo...</p>
      ) : weather?.current ? (
        <div className="mt-2 flex items-center gap-4 text-xs text-primary-foreground/60">
          <span className="flex items-center gap-1"><Thermometer size={13} /> {Math.round(weather.current.temperature_2m)}°C</span>
          <span className="flex items-center gap-1"><Wind size={13} /> {Math.round(weather.current.wind_speed_10m)} km/h</span>
        </div>
      ) : null}
    </div>
  );
}

