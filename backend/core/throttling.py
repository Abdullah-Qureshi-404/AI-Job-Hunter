from rest_framework.throttling import UserRateThrottle


class SupabaseUserRateThrottle(UserRateThrottle):
    def get_cache_key(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return None

        user_id = request.user.id

        return f"throttle_user_{user_id}"