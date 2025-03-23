<script lang="ts">
    import { onMount } from 'svelte';
    import { format, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, subWeeks, addDays, getDay, getYear, startOfYear, endOfYear, lastDayOfDecade } from 'date-fns';
    import { Button } from "$lib/components/ui/button";

    export let activities: any[] = [];

    let heatmapDataByYear: { [year: number]: { date: Date, type: string, totalTime: number }[] } = {};
    let weeksByYear: { [year: number]: Date[][] } = {};
    let monthLabelsByYear: { [year: number]: { month: string, index: number }[] } = {};
    let past52Weeks: Date[][] = [];
    let past52WeeksMonthLabels: { month: string, index: number }[] = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    let showAllYears = false;
    let years: number[] = [];
    let hoveredDate: Date | null = null;
    let tooltipPosition = { x: 0, y: 0 };

    onMount(() => {
        years = Array.from(new Set(activities.map(a => getYear(new Date(a.startTime)))));
        if (years.length > 0) {
            generateHeatmapDataForYear(years[0]); // Most recent year
            console.log(years[0])
        }
        generatePast52WeeksData();
    });

    function generateHeatmapDataForYear(year: number) {
        const startDate = startOfYear(new Date(year, 0, 1));
        const endDate = endOfYear(new Date(year, 0, 1));
        const dates = eachDayOfInterval({ start: startDate, end: endDate });

        // Initialize heatmap data
        heatmapDataByYear[year] = dates.map(date => {
            const dayActivities = activities.filter(a => isSameDay(new Date(a.startTime), date));
            const type = getActivityType(dayActivities);
            const totalTime = getTotalTime(dayActivities);
            return {
                date,
                type,
                totalTime
            };
        });

        // Group dates by week
        weeksByYear[year] = [];
        let currentWeek: Date[] = [];
        dates.forEach(date => {
            if (currentWeek.length === 0 || isSameDay(startOfWeek(date), startOfWeek(currentWeek[0]))) {
                currentWeek.push(date);
            } else {
                weeksByYear[year].push(currentWeek);
                currentWeek = [date];
            }
        });
        if (currentWeek.length > 0) {
            weeksByYear[year].push(currentWeek);
        }

        // Generate month labels
        monthLabelsByYear[year] = [];
        dates.forEach((date, index) => {
            if (date.getDate() === 1) {
                monthLabelsByYear[year].push({ month: format(date, 'MMM'), index });
            }
        });
    }

    function generatePast52WeeksData() {
        const endDate = endOfWeek(new Date());
        const startDate = subWeeks(endDate, 51);
        const dates = eachDayOfInterval({ start: startDate, end: endDate });

        // Group dates by week
        past52Weeks = [];
        let currentWeek: Date[] = [];
        dates.forEach(date => {
            if (currentWeek.length === 0 || isSameDay(startOfWeek(date), startOfWeek(currentWeek[0]))) {
                currentWeek.push(date);
            } else {
                past52Weeks.push(currentWeek);
                currentWeek = [date];
            }
        });
        if (currentWeek.length > 0) {
            past52Weeks.push(currentWeek);
        }

        // Generate month labels for past 52 weeks
        past52WeeksMonthLabels = [];
        dates.forEach((date, index) => {
            if (date.getDate() === 1) {
                past52WeeksMonthLabels.push({ month: format(date, 'MMM'), index });
            }
        });
    }

    function getActivityType(dayActivities: any[]): string {
        const hasStrength = dayActivities.some(activity => activity && activity.exerciseSets && activity.exerciseSets.length > 0);
        const hasCardio = dayActivities.some(activity => activity && (!activity.exerciseSets || activity.exerciseSets.length === 0));
        if (hasStrength && hasCardio) {
            return 'both';
        } else if (hasStrength) {
            return 'strength';
        } else if (hasCardio) {
            return 'cardio';
        } else {
            return 'none';
        }
    }

    function getTotalTime(dayActivities: any[]): number {
        return dayActivities.reduce((total, activity) => total + (activity?.time / 60 || 0), 0);
    }

    function getColor(type: string): string {
        switch (type) {
            case 'cardio':
                return 'bg-[#fc4c02]';
            case 'strength':
                return 'bg-sky-700';
            case 'both':
                return 'bg-green-600';
            default:
                return 'bg-secondary'; 
        }
    }

    function getOpacity(totalTime: number): number {
        const maxTime = 120; 
        const opacity = Math.round(Math.min(((totalTime / maxTime) *10), 10))*10;
        return opacity;
    }

    function loadMoreYears() {
        years.slice(1,).forEach(year => {
            generateHeatmapDataForYear(year);
        });
        showAllYears = true;
    }

    function handleMouseOver(event: MouseEvent, date: Date) {
        hoveredDate = date;
        tooltipPosition = {
            x: event.clientX + 10,
            y: event.clientY + 10
        };
    }

    function handleMouseOut() {
        hoveredDate = null;
    }

    function formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        return hours>0 ? `${hours}h ${minutes}m` : `${minutes}m`; 
    }
</script>

<div class="pb-10">
    <div class="mx-auto w-fit">
        <div class="flex justify-center space-x-4 pt-4">
            <div class="flex items-center">
                <div class="w-[12px] h-[12px] bg-sky-700 rounded-[2px] mr-2"></div>
                <span>Weightlifting</span>
            </div>
            <div class="flex items-center">
                <div class="w-[12px] h-[12px] bg-[#fc4c02] rounded-[2px] mr-2"></div>
                <span>Cardio</span>
            </div>
            <div class="flex items-center">
                <div class="w-[12px] h-[12px] bg-green-600 rounded-[2px] mr-2"></div>
                <span>Both</span>
            </div>
        </div>
        <h2 class="text-2xl text-center font-black pb-4 pt-4">Last Year</h2>
        <div class="flex">
            <div class="mt-[1px] text-right pr-1">   
                {#each weekdays as weekday}
                    <div class="text-[9.5px] -my-[1.1px]">{weekday}</div>
                {/each}
            </div>
            {#each past52Weeks as week}
                <div class="mx-[1px] {week === past52Weeks[0] ? 'mt-auto' : ''}">
                    {#each week as date}
                        {@const dayActivities = activities.filter(a => isSameDay(new Date(a.startTime), date))}
                        <div 
                            class="w-[12px] h-[12px] my-[1px] rounded-[2px] shadow-slate-900/10 dark:shadow-slate-900/50 shadow-inner {getColor(getActivityType(dayActivities))} opacity-{getOpacity(getTotalTime(dayActivities))}" 
                            title="{format(date, 'yyyy-MM-dd')}"
                            on:mouseover={(e) => handleMouseOver(e, date)}
                            on:mouseout={handleMouseOut}>
                        </div>
                    {/each}
                </div>
            {/each}
        </div>
        <div class="flex px-1">
            {#each past52WeeksMonthLabels as { month, index }}
                <div class="mx-[25px] flex w-[13px] text-[9px]" style="grid-column-start: {index + 2}">{month}</div>
            {/each}
        </div>
    </div>
    <div class="pt-4">
        <h2 class="text-2xl font-black text-center">By Year</h2>
        {#each (Object.keys(heatmapDataByYear)).reverse() as year, index}
            {#if String(year) === String(years[0]) || showAllYears}
                <div class="mx-auto w-fit">
                    <h2 class="text-xs px-8 transform scale-x-[102.5%] font-black pt-2">{year}</h2>
                    <div class="flex">
                        <div class="mt-[1px] text-right pr-1">   
                            {#each weekdays as weekday}
                                <div class="text-[9.5px] -my-[1.1px]">{weekday}</div>
                            {/each}
                        </div>
                        {#each weeksByYear[year] as week}
                            <div class="mx-[1px] {week === weeksByYear[year][0] ? 'mt-auto' : ''}">
                                {#each week as date}
                                    {@const activity = heatmapDataByYear[year].find(d => isSameDay(d.date, date))}
                                    <div 
                                        class="w-[12px] h-[12px] my-[1px] rounded-[2px] shadow-slate-900/10 dark:shadow-slate-900/50 shadow-inner {getColor(activity?.type)} opacity-{getOpacity(activity?.totalTime)}" 
                                        title="{format(date, 'yyyy-MM-dd')}"
                                        on:mouseover={(e) => handleMouseOver(e, date)}
                                        on:mouseout={handleMouseOut}>
                                    </div>
                                {/each}
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
            <div class="w-fit mx-auto">
                <div class="flex">
                    {#each monthLabelsByYear[year] as { month, index }}
                        <div class="mx-[24.5px] flex w-[13px] text-[9px]" style="grid-column-start: {index + 2}">{month}</div>
                    {/each}
                </div>
            </div>
        {/each}
        {#if !showAllYears}
            <div class="flex justify-center pt-4">
                <Button 
                    variant='outline'
                    onclick={loadMoreYears}>
                    Load More
                </Button>
            </div>
        {/if}
    </div>
</div>

{#if hoveredDate}
    <div
        class="dark:invert fixed bg-white bg-opacity-90 p-2 rounded shadow-sm shadow-slate-400 dark:shadow-white z-50 text-md font-medium text-gray-800 whitespace-nowrap"
        style="top: {tooltipPosition.y}px; left: {tooltipPosition.x}px;">
        <h4 class="m-0 mb-1 font-bold">{hoveredDate.toLocaleDateString('en-US', {weekday: "long",year: "numeric",month: "long",day: "numeric",})}</h4>
        {#each activities.filter(a => isSameDay(new Date(a.startTime), hoveredDate)) as activity}
            <p class="m-0">
                {#if activity.exerciseSets}
                    <b>Strength</b> - <b>{activity.exerciseSets.length} sets</b><br>
                {:else}
                    <b>{activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}</b> - <b>{formatDuration(activity.time)}</b><br>
                {/if} 
            </p>
        {/each}
    </div>
{/if}