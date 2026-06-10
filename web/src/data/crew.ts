export interface CrewMember {
    readonly name: string;
    readonly role: string;
    readonly url?: string;
}

// Die vier, die das Kollektiv tragen — Rollen hier zentral pflegen.
export const crew: CrewMember[] = [
    { name: "Paul", role: "orga · technik · visuals" },
    { name: "Pepe", role: "orga · dj" },
    { name: "Milan", role: "orga · dj" },
    { name: "Felix", role: "orga · dj" }
];
