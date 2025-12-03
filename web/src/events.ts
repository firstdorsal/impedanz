import { Event } from "./types";

const cityClubAugsburg = {
    name: "City Club Augsburg",
    latitude: 48.365419,
    longitude: 10.895053
};

const karo10 = {
    name: "Karo10",
    latitude: 48.369852,
    longitude: 10.898206
};

export const events: Event[] = [
    {
        title: "genesis",
        imageUrl: "/assets/images/genesis.jpg",
        imageAlt: "A glowing polygon looking like the explosion of a star",
        dateTimeStart: new Date("2025-04-25T23:00:00+02:00"),
        dateTimeEnd: new Date("2025-04-26T07:00:00+02:00"),
        location: cityClubAugsburg,
        description: `A new impulse emerges.
Impedanz enters the floor with a premiere designed to resonate deep. Expect raw grooves, hypnotic rhythms and bodies in sync from open to close.
Driven by detail, shaped by sound and grounded in awareness – this is only the beginning.`,
        ticketLink: "",
        ageRestriction: "18+",
        genre: "Hypnotic, Minimal, Hardgroove 135-155BPM",
        acts: [
            {
                artists: [
                    {
                        name: "Tyrellativ",
                        url: "https://www.instagram.com/tyrellativ/"
                    },
                    {
                        name: "Artifex",
                        url: "https://www.instagram.com/artifex.wav/"
                    }
                ],
                artistJoiner: "b2b"
            },
            {
                artists: [
                    {
                        name: "TONSAMMLER",
                        url: "https://www.instagram.com/ton.sammler/"
                    },
                    {
                        name: "Animar"
                    }
                ],
                artistJoiner: "b2b"
            },
            {
                artists: [
                    {
                        name: "Fio_licious"
                    },
                    {
                        name: "balanced crohn",
                        url: "https://www.instagram.com/pepe_8_6_1/"
                    }
                ],
                artistJoiner: "b2b"
            },
            {
                artists: [
                    {
                        name: "kardioversion",
                        url: "https://www.instagram.com/kardioversion.music/"
                    },
                    {
                        name: "DJCANDYFLIP",
                        url: "https://www.instagram.com/dj.candyflip/"
                    }
                ],
                artistJoiner: "b2b"
            }
        ]
    },
    {
        title: "duality",
        description: "",
        dateTimeStart: new Date("2025-07-12T23:00:00+02:00"),
        dateTimeEnd: new Date("2025-07-13T07:00:00+02:00"),
        location: cityClubAugsburg,
        genre: "Techno",
        ageRestriction: "18+",
        imageUrl: "/assets/images/duality-square.jpg",
        imageAlt: "A black and white glitched image with a few colorful elements",
        acts: [
            {
                artists: [
                    {
                        name: "HYPNOSTA",
                        url: "https://www.instagram.com/_hypnosta_/"
                    }
                ]
            },
            {
                artists: [
                    {
                        name: "PEPE",
                        url: "https://www.instagram.com/pepe_8_6_1/"
                    }
                ]
            },
            {
                artists: [
                    {
                        name: "TONSAMMLER",
                        url: "https://www.instagram.com/ton.sammler/"
                    },
                    {
                        name: "Animar"
                    }
                ],
                artistJoiner: "b2b"
            }
        ]
    },
    {
        title: "trinity",
        description: "",
        dateTimeStart: new Date("2025-09-12T23:00:00+02:00"),
        dateTimeEnd: new Date("2025-09-13T07:00:00+02:00"),
        location: cityClubAugsburg,
        genre: "Techno",
        ageRestriction: "18+",
        imageUrl: "/assets/images/trinity-square.jpg",
        imageAlt: "A green stylized version of the trinity explosion.",
        acts: [
            {
                artists: [
                    {
                        name: "TONSAMMLER",
                        url: "https://www.instagram.com/ton.sammler/"
                    },
                    {
                        name: "Animar"
                    }
                ],
                artistJoiner: "b2b"
            },
            {
                artists: [
                    {
                        name: "kardioversion",
                        url: "https://www.instagram.com/kardioversion.music/"
                    },
                    {
                        name: "DJCANDYFLIP",
                        url: "https://www.instagram.com/dj.candyflip/"
                    }
                ],
                artistJoiner: "b2b"
            },
            {
                artists: [
                    {
                        name: "PEPE",
                        url: "https://www.instagram.com/pepe_8_6_1/"
                    },
                    {
                        name: "drischa",
                        url: "https://www.instagram.com/dri.scha/"
                    }
                ],
                artistJoiner: "b2b"
            }
        ]
    },
    {
        title: "galaxy",
        description: "",
        dateTimeStart: new Date("2025-12-12T20:00:00+01:00"),
        dateTimeEnd: new Date("2025-12-12T06:00:00+01:00"),
        location: cityClubAugsburg,
        genre: "Techno, Hardtrance, Hardgroove, 140-160BPM",
        ageRestriction: "18+",
        imageUrl: "/assets/images/galaxy-square.jpg",
        imageAlt: "A stylized image of a galaxy with red and blue colors.",
        acts: [
            {
                artists: [
                    {
                        name: "DJanis",
                        url: "https://www.instagram.com/janisweil"
                    }
                ]
            },
            {
                artists: [
                    {
                        name: "dr.penn",
                        url: "https://www.instagram.com/dr.penn_.wav/"
                    },
                    {
                        name: "nile",
                        url: "https://www.instagram.com/nile.techno/"
                    }
                ],
                artistJoiner: "b2b"
            },
            {
                artists: [
                    {
                        name: "babybangs",
                        url: "https://www.instagram.com/leoxleopard"
                    },
                    {
                        name: "Fio_licious",
                        url: "https://www.instagram.com/fio_licious/"
                    }
                ],
                artistJoiner: "b2b"
            },
            {
                artists: [
                    {
                        name: "drischa",
                        url: "https://www.instagram.com/dri.scha/"
                    },
                    {
                        name: "PEPE",
                        url: "https://www.instagram.com/_pepe_matteo_/"
                    }
                ],
                artistJoiner: "b2b"
            },
            {
                artists: [
                    {
                        name: "Animar",
                        url: "https://www.instagram.com/animar.imp/"
                    },
                    {
                        name: "TONSAMMLER",
                        url: "https://www.instagram.com/ton.sammler/"
                    }
                ],
                artistJoiner: "b2b"
            },
            {
                artists: [
                    {
                        name: "effymichelle",
                        url: "https://www.instagram.com/effymichelle/"
                    },
                    {
                        name: "pflanzenschranz",
                        url: "https://www.instagram.com/pflanzenschranz/"
                    }
                ],
                artistJoiner: "b2b"
            }
        ]
    },
    {
        title: "apokalypsis",
        description: "",
        dateTimeStart: new Date("2025-12-20T23:00:00+01:00"),
        dateTimeEnd: new Date("2025-12-21T06:00:00+01:00"),
        location: karo10,
        genre: "Techno, Pop",
        ageRestriction: "18+",
        imageUrl: "/assets/images/apokalypsis-square.jpg",
        imageAlt: "A Ortographic view of the floors where the party takes place.",
        acts: []
    }
] as const;
