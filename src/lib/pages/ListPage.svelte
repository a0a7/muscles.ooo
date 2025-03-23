<script lang="ts">
    import { createTable, createRender, Render, Subscribe } from 'svelte-headless-table';
    import {
        addPagination,
        addSortBy,
        addTableFilter,
        addHiddenColumns,
        addSelectedRows
    } from 'svelte-headless-table/plugins';
    import { readable, writable } from 'svelte/store';
    import * as Table from '$lib/components/ui/table'; 
    import ArrowUpDown from 'lucide-svelte/icons/arrow-up-down'; 
    import ChevronDown from 'lucide-svelte/icons/chevron-down'; 
    import CaretSort from 'svelte-radix/CaretSort.svelte';
    import { cn } from '$lib/utils.js';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import ActivityDescriptionCell from '../components/activityTable/ActivityDescriptionCell.svelte';
    import ActivityTimeCell from '../components/activityTable/ActivityTimeCell.svelte';
    import Separator from '$lib/components/ui/separator/separator.svelte';
    import { useMetric } from '../../stores/useMetric.js';
    import { get } from 'svelte/store';

    export let activities: any[] = [];

    let startDate: any, endDate: any;
    const activityTypesFilteredForStore = writable([]);
    const table = createTable(readable(activities), {
        sort: addSortBy({ disableMultiSort: true }),
        searchFilter: addTableFilter({
            fn: ({ filterValue, value }) => value.includes(filterValue)
        }),
        disciplineFilter: addTableFilter({
            fn: ({ activityTypesFilteredFor, value }) => {
                if (activityTypesFilteredFor !== undefined) {
                    return activityTypesFilteredFor.includes(value);
                }
                return true;
            }
        }),
        hide: addHiddenColumns(),
        select: addSelectedRows()
    });

    let distanceUnit = get(useMetric) ? 'km' : 'mi';

    useMetric.subscribe(value => {
        distanceUnit = value ? 'km' : 'mi';
    });

    const columns = table.createColumns([
        table.column({
            accessor: (item) => item,
            header: 'Name',
            id: 'name',
            cell: ({ value: { name, type, id, exerciseSets } }) =>
                createRender(ActivityDescriptionCell, { name, id, type: exerciseSets ? 'strength' : type }),
            plugins: {
                sort: {
                    getSortValue({ name }: { name: string }) {
                        return name;
                    }
                },
                searchFilter: {
                    exclude: false,
                    getFilterValue({ name }: { name: string }) {
                        return name.toLowerCase();
                    }
                },
                disciplineFilter: {
                    exclude: false,
                    getFilterValue({ type, exerciseSets }: { type: string, exerciseSets: any }) {
                        return exerciseSets ? 'strength' : type;
                    }
                }
            }
        }),
        table.column({
            accessor: 'time',
            header: 'Time',
            cell: ({ value }) =>
                createRender(ActivityTimeCell, { value }),
            plugins: {
                searchFilter: {
                    exclude: true
                },
                disciplineFilter: {
                    exclude: true
                },
                sort: {
                    getSortValue(value: number) {
                        if (!value || value === undefined || value === 0) {
                            return 0;
                        }
                        return value;
                    }
                }
            }
        }),
        table.column({
            accessor: (item) => item,
            header: 'Dist/Sets',
            cell: ({ value: { dist, exerciseSets } }) => {
                if (exerciseSets && exerciseSets.length > 0) {
                    return `${exerciseSets.length} sets`;
                }
                if (dist === 0) {
                    return '-';
                }
                const distance = distanceUnit === 'km' ? (dist / 1000).toFixed(2) : (dist / 1609.34).toFixed(2);
                return `${distance} ${distanceUnit}`;
            },
            plugins: {
                searchFilter: {
                    exclude: true
                },
                disciplineFilter: {
                    exclude: true
                },
                sort: {
                    getSortValue(value: number, row: any) {
                        if (row.exerciseSets) {
                            return row.exerciseSets.length;
                        }
                        if (!value || value === undefined || value === 0) {
                            return 0;
                        }
                        return value;
                    }
                }
            }
        }),
        table.column({
            accessor: 'avgHR',
            header: 'Average HR',
            cell: ({ value }) => {
                if (value === undefined) {
                    return '-';
                }
                return `${value.toFixed(0)} bpm`;
            },
            plugins: {
                searchFilter: {
                    exclude: true
                },
                disciplineFilter: {
                    exclude: true
                },
                sort: {
                    getSortValue(value: number) {
                        if (!value || value === undefined || value === 0) {
                            return 0;
                        }
                        return value;
                    }
                }
            }
        })
    ]);

    const { headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates, flatColumns, rows } =
        table.createViewModel(columns);
    
    const ids = flatColumns.map((col) => col.id);

    const { filterValue } = pluginStates.searchFilter;
    const { activityTypesFilteredFor } = pluginStates.disciplineFilter;

    const { hiddenColumnIds } = pluginStates.hide;
    const { selectedDataIds } = pluginStates.select;
    const { sortKeys } = pluginStates.sort;

</script>

<div class="mx-[6rem]">
    <div class="overflow-x-auto rounded-md">
        <div class="flex space-x-1 pt-4">
            <!--<ActivityTypeSelect bind:value={$activityTypesFilteredForStore}/>
            <DateRangePicker activities={activities} bind:startDate bind:endDate />-->
        </div>
    </div>

    <div class="flex items-center py-4">
        <Input
            class="max-w-72 mr-4 bg-background"
            placeholder="Search activities..."
            type="text"
            bind:value={$filterValue}
        />
    </div>
    <div class="overflow-auto h-[85vh] max-h-[80%] md:max-h-[65%] max-w-[calc(100vw-2rem)] md:max-w-[calc(100vw-5rem)] rounded-md border">
        <Table.Root {...$tableAttrs} class="bg-background">
            <Table.Header>
                {#each $headerRows as headerRow}
                    <Subscribe rowAttrs={headerRow.attrs()}>
                        <Table.Row>
                            {#each headerRow.cells as cell (cell.id)}
                                <Subscribe attrs={cell.attrs()} let:attrs props={cell.props()} let:props>
                                    <Table.Head {...attrs} class="pr-0 [&:has([role=checkbox])]:pl-3">
                                        <Button variant="ghost" on:click={props.sort.toggle} class="px-[0.75rem]">
                                            <Render of={cell.render()} />
                                            <!--<CaretSort
                                                class={cn(
                                                    $sortKeys[0]?.id === cell.id && 'text-foreground',
                                                    'ml-2 h-4 w-4'
                                                )}
                                            />-->
                                        </Button>
                                    </Table.Head>
                                </Subscribe>
                            {/each}
                        </Table.Row>
                    </Subscribe>
                {/each}
            </Table.Header>
            <Table.Body {...$tableBodyAttrs}>
                {#each $pageRows as row (row.id)}
                    <Subscribe rowAttrs={row.attrs()} let:rowAttrs>
                        <Table.Row {...rowAttrs} data-state={$selectedDataIds[row.id] && 'selected'} class="">
                            {#each row.cells as cell (cell.id)}
                                <Subscribe attrs={cell.attrs()} let:attrs>
                                    <Table.Cell
                                        {...attrs}
                                        class={cell.id === 'name' ? 'truncate max-w-40 min-w-2' : ''}
                                    >
                                        <Render of={cell.render()} />
                                    </Table.Cell>
                                </Subscribe>
                            {/each}
                        </Table.Row>
                    </Subscribe>
                {/each}
            </Table.Body>
        </Table.Root>
    </div>
</div>