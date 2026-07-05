import logging
from repositories.budget_repository import BudgetRepository

logger = logging.getLogger(__name__)


class BudgetService:
    def __init__(self):
        self.budget_repo = BudgetRepository()

    def set_limit(self, user_id: int, category_id: int, monthly_limit: float):
        self.budget_repo.set_limit(user_id, category_id, monthly_limit)

    def update_limit(self, budget_id: int, user_id: int, monthly_limit: float):
        self.budget_repo.update_limit(budget_id, user_id, monthly_limit)

    def delete(self, budget_id: int, user_id: int):
        self.budget_repo.delete(budget_id, user_id)

    def list_all(self, user_id: int):
        return self.budget_repo.find_by_user(user_id)

    def get_utilization(self, user_id: int, month: int, year: int):
        return self.budget_repo.get_utilization(user_id, month, year)
