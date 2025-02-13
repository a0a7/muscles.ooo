<script lang="ts">
    import { onMount } from 'svelte';
    import { fetchWeatherApi } from 'openmeteo';
    import { DBSCAN } from 'density-clustering';
    import { min, max, quantile } from 'simple-statistics';

    export let activities: any[] = [];

    let hoveredActivity = null;
    let activityTemperatures = [];

    const validActivities = activities.filter(activity => {
        const [lat, lng] = activity.startLatLng || [];
        return !isNaN(lat) && !isNaN(lng);
    });

    const clusterActivities = (activities) => {
        const dbscan = new DBSCAN();
        const epsilon = 0.01; // Adjust this value based on the desired clustering distance
        const minPoints = 1; // Minimum number of points to form a cluster

        const coordinates = activities.map(activity => activity.startLatLng);
        const clusters = dbscan.run(coordinates, epsilon, minPoints);
        return clusters.map(cluster => cluster.map(index => activities[index]));
    };

    const fetchWeatherData = async (latitude, longitude, startDate, endDate) => {
        if (latitude === null || longitude === null) {
            throw new Error('Invalid latitude or longitude');
        }

        const params = {
            latitude,
            longitude,
            start_date: startDate,
            end_date: endDate,
            hourly: ["temperature_2m", "relative_humidity_2m", "apparent_temperature", "precipitation", "surface_pressure", "cloud_cover", "wind_speed_100m", "wind_direction_100m"],
            daily: ["apparent_temperature_max", "apparent_temperature_min", "apparent_temperature_mean", "sunrise", "sunset", "daylight_duration", "sunshine_duration"]
        };

        const url = "https://archive-api.open-meteo.com/v1/archive";
        const responses = await fetchWeatherApi(url, params);
        return responses[0];
    };

    const fetchAllWeatherData = async () => {
        const clusters = clusterActivities(validActivities);
        console.log(clusters)
        const weatherDataMap = new Map();

        for (const cluster of clusters) {
            if (cluster.length > 0) {
                const [latitude, longitude] = cluster[0].startLatLng;
                if (latitude === null || longitude === null) continue;

                const startDate = cluster.reduce((minDate, activity) => {
                    const activityDate = new Date(activity.startTime.split(' ')[0]);
                    return activityDate < minDate ? activityDate : minDate;
                }, new Date(cluster[0].startTime.split(' ')[0])).toISOString().split('T')[0];
                const endDate = cluster.reduce((maxDate, activity) => {
                    const activityDate = new Date(activity.startTime.split(' ')[0]);
                    return activityDate > maxDate ? activityDate : maxDate;
                }, new Date(cluster[0].startTime.split(' ')[0])).toISOString().split('T')[0];

                try {
                    const weatherData = await fetchWeatherData(latitude, longitude, startDate, endDate);
                    cluster.forEach(activity => {
                        weatherDataMap.set(activity.id, weatherData);
                    });
                } catch (error) {
                    console.error(`Failed to fetch weather data for cluster starting at (${latitude}, ${longitude}):`, error);
                }
            }
        }
        console.log("Weather Data Map:", weatherDataMap);
        return weatherDataMap;
    };

    const calculateStatistics = (weatherDataMap) => {
        const temperatures = [];
        let longestActivityBelowFreezing = 0;
        let activitiesBeforeSunrise = 0;
        let activitiesAfterSunset = 0;
        let highestWindSpeed = 0;

        let minTempActivity = null;
        let maxTempActivity = null;
        let highestWindSpeedActivity = null;

        activityTemperatures = validActivities.map(activity => {
            const weatherData = weatherDataMap.get(activity.id);
            if (weatherData) {
                const hourly = weatherData.hourly()!;
                const daily = weatherData.daily()!;

                if (!hourly || !daily || !daily.variables(3) || !daily.variables(4)) return { activity, temp: null };

                const activityStartTime = new Date(activity.startTime);
                const startHour = activityStartTime.getHours();

                const decodeByteBuffer = (byteBuffer) => {
                    const textDecoder = new TextDecoder("utf-8");
                    return textDecoder.decode(byteBuffer._bytes);
                };

                const sunrise = daily.variables(3) ? new Date(parseInt(decodeByteBuffer(daily.variables(3)))) : null;
                const sunset = daily.variables(4) ? new Date(parseInt(decodeByteBuffer(daily.variables(4)))) : null;

                if (sunrise && activityStartTime < sunrise) activitiesBeforeSunrise++;
                if (sunset && activityStartTime > sunset) activitiesAfterSunset++;

                console.log(`Activity ID: ${activity.id}, Start Hour: ${startHour}`);
                console.log('Hourly Data:', hourly);

                const temp = hourly.variables(0)?.valuesArray()[startHour];
                console.log(`Extracted Temperature: ${temp}`);

                if (temp !== null && temp !== undefined) {
                    temperatures.push(temp);

                    if (temp < 0) {
                        const durationBelowFreezing = activity.time;
                        if (durationBelowFreezing > longestActivityBelowFreezing) {
                            longestActivityBelowFreezing = durationBelowFreezing;
                        }
                    }

                    if (minTempActivity === null || temp < minTempActivity.temp) {
                        minTempActivity = { temp, activity };
                    }

                    if (maxTempActivity === null || temp > maxTempActivity.temp) {
                        maxTempActivity = { temp, activity };
                    }

                    return { activity, temp };
                }

                const windSpeed = hourly.variables(6)?.valuesArray()[startHour];
                if (windSpeed !== null && windSpeed !== undefined && windSpeed > highestWindSpeed) {
                    highestWindSpeed = windSpeed;
                    highestWindSpeedActivity = activity;
                }
            }
            return { activity, temp: null };
        });

        return {
            minTemp: temperatures.length ? min(temperatures) : null,
            maxTemp: temperatures.length ? max(temperatures) : null,
            q25Temp: temperatures.length ? quantile(temperatures, 0.25) : null,
            q50Temp: temperatures.length ? quantile(temperatures, 0.5) : null,
            q75Temp: temperatures.length ? quantile(temperatures, 0.75) : null,
            longestActivityBelowFreezing,
            activitiesBeforeSunrise,
            activitiesAfterSunset,
            highestWindSpeed,
            minTempActivity,
            maxTempActivity,
            highestWindSpeedActivity
        };
    };

    let statistics = {};

    onMount(async () => {
        const weatherDataMap = await fetchAllWeatherData();
        statistics = calculateStatistics(weatherDataMap);
        console.log('Statistics:', statistics);
    });
</script>

<style>
    .tooltip {
        position: absolute;
        background-color: white;
        border: 1px solid black;
        padding: 5px;
        z-index: 10;
    }
</style>

<div class="max-w-[86.5%] px-6 lg:px-8 mx-auto">
    <h2 class="text-3xl font-bold mx-auto mt-8 text-center">Cycling Weather Summary</h2>
    
    <div class="mt-8">
        <p class="text-lg" on:mouseover={() => hoveredActivity = statistics.minTempActivity?.activity} on:mouseout={() => hoveredActivity = null}>
            <strong>Min Temperature:</strong> {statistics.minTemp !== null ? `${statistics.minTemp}°C` : 'N/A'}
        </p>
        <p class="text-lg" on:mouseover={() => hoveredActivity = statistics.maxTempActivity?.activity} on:mouseout={() => hoveredActivity = null}>
            <strong>Max Temperature:</strong> {statistics.maxTemp !== null ? `${statistics.maxTemp}°C` : 'N/A'}
        </p>
        <p class="text-lg"><strong>25% Temperature:</strong> {statistics.q25Temp !== null ? `${statistics.q25Temp}°C` : 'N/A'}</p>
        <p class="text-lg"><strong>50% Temperature:</strong> {statistics.q50Temp !== null ? `${statistics.q50Temp}°C` : 'N/A'}</p>
        <p class="text-lg"><strong>75% Temperature:</strong> {statistics.q75Temp !== null ? `${statistics.q75Temp}°C` : 'N/A'}</p>
        <p class="text-lg"><strong>Longest Activity Below Freezing:</strong> {statistics.longestActivityBelowFreezing / 3600} hours</p>
        <p class="text-lg"><strong>Activities Before Sunrise:</strong> {statistics.activitiesBeforeSunrise}</p>
        <p class="text-lg"><strong>Activities After Sunset:</strong> {statistics.activitiesAfterSunset}</p>
        <p class="text-lg" on:mouseover={() => hoveredActivity = statistics.highestWindSpeedActivity} on:mouseout={() => hoveredActivity = null}>
            <strong>Highest Wind Speed:</strong> {statistics.highestWindSpeed} m/s
        </p>
    </div>

    {#if hoveredActivity}
        <div class="tooltip">
            <p><strong>Activity ID:</strong> {hoveredActivity.id}</p>
            <p><strong>Start Time:</strong> {hoveredActivity.startTime}</p>
            <p><strong>Duration:</strong> {hoveredActivity.time} seconds</p>
            <p><strong>Start LatLng:</strong> {hoveredActivity.startLatLng}</p>
        </div>
    {/if}

    <div class="mt-8">
        <h3 class="text-2xl font-bold">Activity Temperatures</h3>
        <ul>
            {#each activityTemperatures as { activity, temp }}
                <li>
                    <strong>Activity ID:</strong> {activity.id}, 
                    <strong>Date:</strong> {new Date(activity.startTime).toLocaleDateString()}, 
                    <strong>Name:</strong> {activity.name}, 
                    <strong>Temperature:</strong> {temp !== null ? `${temp}°C` : 'N/A'}
                </li>
            {/each}
        </ul>
    </div>
</div>