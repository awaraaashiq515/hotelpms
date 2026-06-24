import asyncio
from app.services.vision_service import vision_service

async def test():
    dummy_text = "Burger 50\nFries 30"
    res = await vision_service._run_text_llm_parser(dummy_text)
    print(res)

asyncio.run(test())
