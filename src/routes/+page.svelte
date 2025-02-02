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

    let p: string | null = null;

    const queryParam = derived(page, $page => {
        const urlParams = new URLSearchParams($page.url.search);
        return urlParams.get('p') ?? 'home';
    });

    onMount(() => {
        const unsubscribe = queryParam.subscribe(value => {
            p = value;
        });
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
        {#if p === 'home'}
        {:else if p === 'calendar'}
            <CalendarPage />
        {:else if p === 'list'}
            <ListPage />
        {:else if p === 'weights-volume'}
            <WeightsVolumePage />
        {:else if p === 'weights-stats'}
            <WeightsStatsPage />
        {:else if p === 'cycling-stats'}
            <CyclingStatsPage />
        {:else if p === 'cycling-map'}
            <CyclingMapPage />
        {:else}
            <p>Page not found</p>
        {/if}
    </Sidebar.Inset>
</Sidebar.Provider>