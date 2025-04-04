/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        colors: {
            red: "#b22222",
            marker: "#b22222"
        },
        fontFamily: {},
        extend: {
            transitionProperty: {
                height: "height"
            }
        }
    },
    plugins: []
};
