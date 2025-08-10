<script lang="ts">
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import type { ComponentProps } from "svelte";
    import { House, Dumbbell, Bike, Calendar, Library, Sun, Moon } from 'lucide-svelte';	
    import { toggleMode } from "mode-watcher";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { Switch } from "bits-ui";
    import { useMetric } from "../../stores/useMetric.js";
    import { get } from 'svelte/store';

    let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

    function toggleUnit() {
        useMetric.set(!get(useMetric));
        console.log(get(useMetric));
    }
</script>

<Sidebar.Root {...restProps} bind:ref class="pl-2 pt-2">
    <Sidebar.Header>
        <div class="flex items-center justify-between ">
            <div>
                <p><b>muscles.ooo</b> v0.1</p>
                <p><a href="https://github.com/a0a7" target="_blank">hello who made this</a></p>
            </div>
            <div class="h-full pr-1">
                <Button variant="outline" size="icon" onclick={toggleMode}>
                    <Sun
                    class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
                    />
                    <Moon
                    class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
                    />
                    <span class="sr-only">Toggle theme</span>
                </Button>
            </div>
        </div>
    </Sidebar.Header>
    <Sidebar.Content>
        <!-- Hard-coded sidebar content -->
        <Sidebar.Group>
            <Sidebar.GroupContent>
                <Sidebar.Menu>
                    <Sidebar.MenuItem>
                        <Sidebar.MenuButton isActive={true}>
                            {#snippet child({ props })}
                                <a href="?p=home" {...props}><House /> Home</a>
                            {/snippet}
                        </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                    <Sidebar.MenuItem>
                        <Sidebar.MenuButton>
                            {#snippet child({ props })}
                                <a href="?p=calendar" {...props}><Calendar /> Calendar</a>
                            {/snippet}
                        </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                    <Sidebar.MenuItem>
                        <Sidebar.MenuButton>
                            {#snippet child({ props })}
                                <a href="?p=list" {...props}><Library /> All Exercises</a>
                            {/snippet}
                        </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                </Sidebar.Menu>
            </Sidebar.GroupContent>
        </Sidebar.Group>

        <Sidebar.Group>
            <Sidebar.GroupLabel><Dumbbell /> &nbsp; Weightlifting</Sidebar.GroupLabel>
            <Sidebar.GroupContent>
                <Sidebar.Menu>
                    <Sidebar.MenuItem>
                        <Sidebar.MenuButton isActive={false}>
                            {#snippet child({ props })}
                                <a href="?p=weights-stats" {...props}>Statistics</a>
                            {/snippet}
                        </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                    <Sidebar.MenuItem>
                        <Sidebar.MenuButton isActive={false}>
                            {#snippet child({ props })}
                                <a href="?p=weights-charts" {...props}>Metric Distributions</a>
                            {/snippet}
                        </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                    <Sidebar.MenuItem>
                        <Sidebar.MenuButton>
                            {#snippet child({ props })}
                                <a href="?p=weights-volume" {...props}>Muscles</a>
                            {/snippet}
                        </Sidebar.MenuButton>   
                    </Sidebar.MenuItem>
                    <Sidebar.MenuItem>
                        <Sidebar.MenuButton>
                            {#snippet child({ props })}
                                <a href="?p=weights-progression" {...props}>Progression</a>
                            {/snippet}
                        </Sidebar.MenuButton>   
                    </Sidebar.MenuItem>
                </Sidebar.Menu>
            </Sidebar.GroupContent>
        </Sidebar.Group>
        <Sidebar.Group>
            <Sidebar.GroupLabel><Bike /> &nbsp; Cycling</Sidebar.GroupLabel>
            <Sidebar.GroupContent>
                <Sidebar.Menu>
                    <Sidebar.MenuItem>
                        <Sidebar.MenuButton>
                            {#snippet child({ props })}
                                <a href="?p=cycling-stats" {...props}>Statistics</a>
                            {/snippet}
                        </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                    <Sidebar.MenuItem>
                        <Sidebar.MenuButton>
                            {#snippet child({ props })}
                                <a href="?p=cycling-charts" {...props}>Charts</a>
                            {/snippet}
                        </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                    <!--<Sidebar.MenuItem>
                        <Sidebar.MenuButton>
                            {#snippet child({ props })}
                                <a href="?p=cycling-map" {...props}>Map</a>
                            {/snippet}
                        </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                    <Sidebar.MenuItem>
                        <Sidebar.MenuButton>
                            {#snippet child({ props })}
                                <a href="?p=cycling-weather" {...props}>Weather</a>
                            {/snippet}
                        </Sidebar.MenuButton>
                    </Sidebar.MenuItem>-->
                </Sidebar.Menu>
            </Sidebar.GroupContent>
        </Sidebar.Group>
    </Sidebar.Content>
    <div class="bottom-0 left-0 w-full p-4 bg-white dark:bg-gray-800 dark:bg-opacity-20">
        <div class="flex items-center justify-between space-x-2">
            <Label for="unit-switch">kg/m/km</Label>
            <Switch.Root
            id="unit-switch"
            class="peer inline-flex h-[20px] min-h-[20px] w-[36px] shrink-0 cursor-pointer items-center rounded-full px-[3px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-foreground data-[state=unchecked]:bg-foreground data-[state=unchecked]:shadow-mini-inset dark:data-[state=checked]:bg-foreground"
            onclick={toggleUnit}
            data-state={$useMetric ? "unchecked" : "checked"}
          >
            <Switch.Thumb
              class="pointer-events-none block size-[16px] shrink-0 rounded-full bg-background transition-transform data-[state=checked]:translate-x-[14px] data-[state=unchecked]:translate-x-0 data-[state=unchecked]:shadow-mini dark:border dark:border-background/30 dark:bg-background dark:shadow-popover dark:data-[state=unchecked]:border"
            />
          </Switch.Root>
            <Label for="unit-switch">lbs/ft/mi</Label>
        </div>
    </div>
    <Sidebar.Rail />
</Sidebar.Root>