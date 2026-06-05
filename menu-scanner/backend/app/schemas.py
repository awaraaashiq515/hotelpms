from typing import List, Optional
from pydantic import BaseModel, Field

class MenuItem(BaseModel):
    name: str = Field(..., description="Name of the food or beverage item")
    price: float = Field(..., description="Price of the item as a floating number")
    half_price: Optional[float] = Field(None, description="Half price of the item, if both half and full prices exist")
    description: Optional[str] = Field(None, description="Short description of ingredients or taste")
    is_vegetarian: Optional[bool] = Field(None, description="True if item is vegetarian, False if non-veg")
    is_spicy: Optional[bool] = Field(None, description="True if the item is explicitly marked as spicy")
    gst_rate: float = Field(5.0, description="Inferred GST percentage for the item (e.g. 5.0 for cooked food, 18.0 for soft drinks/soda)")
    hsn_code: str = Field("9963", description="Inferred HSN code for the item (e.g. '9963' for food services/cooked food, '2202' for non-alcoholic beverages)")

class MenuCategory(BaseModel):
    category_name: str = Field(..., description="Category like Starters, Dessert, Soups, etc.")
    items: List[MenuItem] = Field(..., description="List of items under this category")

class StructuredMenuResponse(BaseModel):
    restaurant_name: Optional[str] = Field(None, description="Detected restaurant name from menu")
    currency: str = Field("INR", description="Currency symbol or abbreviation (e.g. INR, USD, EUR)")
    categories: List[MenuCategory] = Field(..., description="Parsed categories and items")
