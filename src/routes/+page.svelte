<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { derived } from 'svelte/store';
    import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import AppSidebar from "$lib/components/app-sidebar.svelte";
    import CalendarPage from "$lib/pages/CalendarPage.svelte";
    import ListPage from "$lib/pages/ListPage.svelte";
    import WeightsVolumePage from "$lib/pages/WeightsVolumePage.svelte";
    import WeightsStatsPage from "$lib/pages/WeightsStatsPage.svelte";
    import CyclingStatsPage from "$lib/pages/CyclingStatsPage.svelte";
    import CyclingMapPage from "$lib/pages/CyclingMapPage.svelte";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card/';
	import HomePage from '$lib/pages/HomePage.svelte';

    let p: string | null = null;
    let file: File | null = null;
    let fileContent: string | null = null;
    let fileUploaded: boolean = false;
    let workoutActivities: any[] = [];
    let allActivities: any[] = [];

    const queryParam = derived(page, $page => {
        const urlParams = new URLSearchParams($page.url.search);
        return urlParams.get('p') ?? 'home';
    });

    onMount(() => {
        const unsubscribe = queryParam.subscribe(value => {
            p = value;
        });

        const storedWorkoutActivities = localStorage.getItem('workoutActivities');
        const storedAllActivities = localStorage.getItem('allActivities');
        if (storedWorkoutActivities && storedAllActivities) {
            fileUploaded = true;
            workoutActivities = JSON.parse(storedWorkoutActivities);
            allActivities = JSON.parse(storedAllActivities);    
        }

        return () => unsubscribe();
    });

    function formatPageName(page: string | null): string {
        if (!page) return '';
        switch (page) {
            case 'list':
                return 'All Exercises';
            case 'weights-volume':
                return 'Weightlifting Volume';
            case 'weights-stats':
                return 'Weightlifting Statistics';
            case 'cycling-stats':
                return 'Cycling Statistics';
            case 'cycling-map':
                return 'Cycling Map';
            default:
                return page.charAt(0).toUpperCase() + page.slice(1);
        }
    }

    function handleFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            file = input.files[0];
        }
    }

    function handleFileUpload(event: Event) {
        event.preventDefault();
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                fileContent = reader.result as string;
                fileUploaded = true;
                parseFileContent(fileContent);
            };
            reader.readAsText(file);
        }
    }

    function parseFileContent(content: string) {
        const data = JSON.parse(content);
        const workoutActivitiesSet = new Set();
        const allActivitiesSet = new Set();

        data.forEach((activity: any) => {
            if (!allActivitiesSet.has(activity.activityId)) {
                allActivitiesSet.add(activity.activityId);
                allActivities.push(activity);
                if (activity.activityType.typeKey === 'strength_training') {
                    workoutActivities.push(activity);
                }
            }
        });

        localStorage.setItem('workoutActivities', JSON.stringify(workoutActivities));
        localStorage.setItem('allActivities', JSON.stringify(allActivities));
    }
</script>

<Sidebar.Provider>
    <AppSidebar />
    <Sidebar.Inset>
        <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <Sidebar.Trigger class="-ml-1" />
            <Separator orientation="vertical" class="mr-2 h-4" />
            <Breadcrumb.Root>
                <Breadcrumb.List>
                    <Breadcrumb.Item>
                        <Breadcrumb.Page>{formatPageName(p)}</Breadcrumb.Page>
                    </Breadcrumb.Item>
                </Breadcrumb.List>
            </Breadcrumb.Root>
        </header>
        
        {#if !fileUploaded}
            <div class="flex flex-col items-center mt-16">
                <h2 class="font-bold text-3xl">Upload Data</h2>
                <form class="flex flex-col gap-1 max-w-sm mt-6" on:submit={handleFileUpload}>
                    <Label for="fileUpload">json</Label>
                    <Input id="fileUpload" type="file" onchange={handleFileChange} />
                    <Button type="submit" class="mx-auto px-8 mt-4">Upload File</Button>
                </form>
                <p class="max-w-80 pt-6 text-center">To use this website you need to export your Garmin activities using the Garmin Workout Downloader <a class="link" href="https://chromewebstore.google.com/detail/garmin-workout-downloader/hpimimpdkghmejbcldfccdbaebjifnkk" target="_blank" rel="noopener noreferrer">Chrome</a> or <a class="link" href="https://addons.mozilla.org/en-US/firefox/addon/garmin-workout-downloader/" target="_blank" rel="noopener noreferrer">Firefox</a> extension and upload the resultant file here.</p>
            </div>
        {:else}
        {#if p === 'home'}
            <HomePage {workoutActivities} {allActivities} />
            <div class="flex flex-col items-center mt-16">
                <h2 class="font-bold text-3xl">Upload More Data</h2>
                <form class="flex gap-1 max-w-sm mt-6" on:submit={handleFileUpload}>
                    <Input id="fileUpload" type="file" onchange={handleFileChange} />
                    <Button type="submit" class="ml-4">Upload File</Button>
                </form>
                <p class="max-w-80 pt-6 text-center">You can upload another json file to update the list of activities</p>
            </div>

        {:else if p === 'calendar'}
            <CalendarPage {workoutActivities} {allActivities} />
        {:else if p === 'list'}
            <ListPage {workoutActivities} {allActivities} />
        {:else if p === 'weights-volume'}
            <WeightsVolumePage {workoutActivities} />
        {:else if p === 'weights-stats'}
            <WeightsStatsPage {workoutActivities} {allActivities} />
        {:else if p === 'cycling-stats'}
            <CyclingStatsPage {workoutActivities} {allActivities} />
        {:else if p === 'cycling-map'}
            <CyclingMapPage {workoutActivities} {allActivities} />
        {:else}
            <p>Page not found</p>
        {/if}
    {/if}
    </Sidebar.Inset>
</Sidebar.Provider>