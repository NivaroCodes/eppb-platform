"""
Mock интеграции — имитация eGov и ЕИШ.
Реальная интеграция на хакатоне не нужна.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/mock", tags=["mock"])

MOCK_PROFILES = {
    "123456789012": {
        "iin": "123456789012",
        "full_name": "Сейтқали Ерлан Болатұлы",
        "company_name": "ТОО «АгроТех KZ»",
        "bin": "180340021455",
        "phone": "+7 701 234 5678",
        "email": "erlan@agrotech.kz",
        "region": "Алматы",
    }
}


@router.get("/egov/profile")
async def get_egov_profile(iin: str):
    """Автозаполнение данных по ИИН"""
    profile = MOCK_PROFILES.get(iin)
    if not profile:
        # Возвращаем заглушку — не ломаем флоу
        return {
            "iin": iin,
            "full_name": "Тестовый Пользователь",
            "company_name": "ТОО «Тест»",
            "bin": "000000000000",
            "phone": "+7 700 000 0000",
            "email": "test@example.com",
            "region": "Астана",
        }
    return profile


@router.get("/eish/services")
async def get_eish_services():
    """Список услуг из ЕИШ (mock)"""
    return {
        "services": [
            {"id": "leasing_avia", "name": "Лизинг авиатранспорта", "stage": 1},
            {"id": "leasing_wagons", "name": "Лизинг вагонов (экспорт)", "stage": 2},
        ]
    }


@router.post("/eish/submit")
async def submit_to_eish(payload: dict):
    """Имитация отправки заявки в ЕИШ"""
    return {
        "success": True,
        "tracking_number": "EISH-2026-001",
        "message": "Заявка принята в обработку (mock)",
        "received_data": payload,
    }