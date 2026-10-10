"""Seed 1,00,000 deterministic Indian guide records with Prisma."""

from app.db import prisma, run_async

LOCATIONS = [
    "Hyderabad", "Bengaluru", "Mumbai", "Delhi", "Jaipur", "Goa", "Kochi",
    "Chennai", "Kolkata", "Pune", "Varanasi", "Agra", "Udaipur", "Mysuru",
    "Ahmedabad", "Rishikesh", "Amritsar", "Srinagar", "Darjeeling", "Puducherry",
]
SPECIALTIES = ["heritage walks", "food tours", "nature and photography", "family sightseeing", "local culture"]
LANGUAGES = ["English,Hindi", "English,Hindi,Telugu", "English,Hindi,Kannada", "English,Hindi,Tamil"]


async def seed_guides(total: int = 100_000) -> None:
    existing = await prisma.guide.count()
    rows = []
    for index in range(existing, total):
        location = LOCATIONS[index % len(LOCATIONS)]
        rows.append({
            "name": f"{location} Local Guide {index + 1:05d}",
            "location": location,
            "phone_number": f"+91-{9000000000 + index:010d}",
            "languages": LANGUAGES[index % len(LANGUAGES)],
            "price_per_day": round(900 + (index % 35) * 125.5, 2),
            "rating": round(4.0 + (index % 11) / 10, 1),
            "specialties": SPECIALTIES[index % len(SPECIALTIES)],
        })
    if rows:
        await prisma.guide.create_many(data=rows)
    print(f"Seeded {len(rows)} guides; total is now {total}.")


if __name__ == "__main__":
    run_async(seed_guides())
