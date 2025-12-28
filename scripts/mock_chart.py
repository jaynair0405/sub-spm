from fastapi import FastAPI

app = FastAPI()


@app.post("/chart_data")
def chart_data():
    samples = []
    for i in range(20):
        samples.append(
            {
                "timestamp": f"10:{i:02d}",
                "distance": i * 0.5,
                "speed": (i * 7) % 90,
                "station": "" if i % 5 else f"STN{i}",
            }
        )
    return {"samples": samples}
