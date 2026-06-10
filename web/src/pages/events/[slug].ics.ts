import type { APIRoute, GetStaticPaths } from "astro";
import { events } from "../../data/events";
import type { ImpedanzEvent } from "../../data/types";
import { eventToIcs } from "../../lib/ics";

export const getStaticPaths: GetStaticPaths = () => {
    return events.map((event) => ({
        params: { slug: event.slug },
        props: { event }
    }));
};

export const GET: APIRoute<{ event: ImpedanzEvent }> = ({ props }) => {
    return new Response(eventToIcs(props.event), {
        headers: {
            "Content-Type": "text/calendar; charset=utf-8"
        }
    });
};
