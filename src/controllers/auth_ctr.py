import uuid

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from src.routes.jobs_rts import GUPY_URL
from src.models.jobs_mdl import JobsMdl
from src.models.users_mdl import UsersMdl
import requests
from src.utils.settings import database


class DuplicateUserError(Exception):
    """Raised when a username is already registered."""


class InvalidCredentialsError(Exception):
    """Raised for an invalid username/password pair."""


class UserNotFoundError(Exception):
    """Raised when an operation references a missing user."""


def _trim_username(username: str) -> str:
    return username.strip()


def ensure_default_admin() -> UsersMdl | None:
    if not database.inspect(database.engine).has_table("users"):
        return None

    admin = database.session.scalar(
        select(UsersMdl).where(func.lower(UsersMdl.username) == "admin")
    )
    if admin is not None:
        return admin

    admin = UsersMdl(username="admin", role="admin", favorite_jobs=[])
    admin.set_password("admin")
    database.session.add(admin)
    try:
        database.session.commit()
    except IntegrityError:
        database.session.rollback()
        return database.session.scalar(
            select(UsersMdl).where(func.lower(UsersMdl.username) == "admin")
        )
    return admin


def get_user_by_username(username: str) -> UsersMdl | None:
    normalized = _trim_username(username)
    return database.session.scalar(
        select(UsersMdl).where(func.lower(UsersMdl.username) == normalized.lower())
    )


def get_user_by_id(user_id: uuid.UUID) -> UsersMdl | None:
    return database.session.get(UsersMdl, user_id)


def create_user(username: str, password: str, *, role: str = "user") -> UsersMdl:
    normalized = _trim_username(username)
    if not normalized:
        raise ValueError("username is required")

    normalized = normalized.strip()
    if get_user_by_username(normalized) is not None:
        raise DuplicateUserError

    user = UsersMdl(username=normalized, role=role or "user", favorite_jobs=[])
    user.set_password(password)
    database.session.add(user)
    try:
        database.session.commit()
    except IntegrityError as exc:
        database.session.rollback()
        raise DuplicateUserError from exc
    return user


def authenticate_user(username: str, password: str) -> UsersMdl:
    user = get_user_by_username(username)
    if user is None or not user.check_password(password):
        raise InvalidCredentialsError
    return user

def update_user_is_active(user_id: uuid.UUID, is_active: bool) -> UsersMdl:
    user = get_user_by_id(user_id)
    if user is None:
        raise UserNotFoundError

    user.is_active = is_active
    database.session.commit()
    return user

def update_user_profile(
    user_id: uuid.UUID,
    new_username: str | None = None,
    *,
    current_username: str | None = None,
    new_password: str | None = None,
    current_password: str | None = None,
) -> UsersMdl:
    user = get_user_by_id(user_id)
    if user is None:
        raise UserNotFoundError

    if current_username is not None and _trim_username(current_username) != user.username:
        raise ValueError("Você só pode alterar o próprio usuário.")

    if new_username is not None:
        normalized = _trim_username(new_username)
        if not normalized:
            raise ValueError("username is required")

        existing = get_user_by_username(normalized)
        if existing is not None and existing.id != user.id:
            raise DuplicateUserError
        user.username = normalized

    if new_password is not None:
        password = new_password.strip()
        if len(password) < 3:
            raise ValueError("password deve ter no mínimo 3 caracteres.")
        if current_password is None or not user.check_password(current_password):
            raise ValueError("Senha atual incorreta.")
        user.set_password(password)

    database.session.commit()
    return user


def _ensure_user_can_manage_favorites(user: UsersMdl) -> None:
    if user.role == "admin":
        raise ValueError("Administradores não possuem lista de favoritos.")

def _is_uuid(value: str) -> bool:
    try:
        uuid.UUID(value)
        return True
    except ValueError:
        return False

def add_favorite_job(username: str, job_id: str) -> UsersMdl:
    user = get_user_by_username(username)

    if user is None:
        raise UserNotFoundError
    
    _ensure_user_can_manage_favorites(user)

    # Na realidade aqui eu valido na API Pública da GUPY.
    # Não da pra ser pelo ID da Gupy, a API não permite, tem que ser pelas ocorrências do nome e verifica se contai o ID!!
    if _is_uuid(job_id) == False:

        req = requests.get(f"{GUPY_URL}?jobName={job_id}", timeout=15)
        if req.status_code != 200:
            raise ValueError("job not found in api gupy")
            
        data = req.json().get("data", [])

        match = next((j for j in data if j.get("name") == job_id), None)
        if match is None:
            if not data:
                raise ValueError("job not found in api gupy")
            match = data[0]

        external_id = str(match["id"])
        job_model = database.session.execute(
            select(JobsMdl).where(JobsMdl.external_id == external_id)).scalars().first()

        if job_model is None:
            job_model = JobsMdl(
                external_id=external_id,
                title=match.get("name"),
                company=match.get("careerPageName"),
                location=match.get("city"),
                url=match.get("jobUrl"),
                salary=match.get("salary"),
                description=match.get("description"),
                platform="gupy",
                modality=match.get("workplaceType"),
            )
            database.session.add(job_model)
            database.session.commit()

        job_id = str(job_model.id) 

        favorite_jobs = list(user.favorite_jobs or [])
        if str(job_id) not in favorite_jobs:
            favorite_jobs.append(str(job_id))
            user.favorite_jobs = favorite_jobs
            database.session.commit()
        return user

    if database.session.get(JobsMdl, job_id) is None:
        raise ValueError("job not found")

    favorite_jobs = list(user.favorite_jobs or [])
    if str(job_id) not in favorite_jobs:
        favorite_jobs.append(str(job_id))
        user.favorite_jobs = favorite_jobs
        database.session.commit()
        
    return user


def remove_favorite_job(username: str, job_id: str) -> UsersMdl:
    user = get_user_by_username(username)
    if user is None:
        raise UserNotFoundError
    _ensure_user_can_manage_favorites(user)

    if _is_uuid(job_id) == False:
        favorite_jobs = list(user.favorite_jobs or [])
        job_id_str = str(job_id)
        if job_id_str in favorite_jobs:
            favorite_jobs.remove(job_id_str)
            user.favorite_jobs = favorite_jobs
            database.session.commit()
        return user

    if database.session.get(JobsMdl, job_id) is None:
        raise ValueError("job not found")

    favorite_jobs = list(user.favorite_jobs or [])
    job_id_str = str(job_id)
    if job_id_str in favorite_jobs:
        favorite_jobs.remove(job_id_str)
        user.favorite_jobs = favorite_jobs
        database.session.commit()
    return user


def delete_user_by_id(user_id: uuid.UUID) -> UsersMdl:
    user = database.session.get(UsersMdl, user_id)
    if user is None:
        raise UserNotFoundError
    if user.role == "admin":
        raise ValueError("O usuário admin não pode ser removido.")

    database.session.delete(user)
    database.session.commit()
    return user


def list_users() -> list[UsersMdl]:
    return database.session.query(UsersMdl).order_by(UsersMdl.username.asc()).all()


def list_favorite_jobs(username: str) -> list[JobsMdl]:
    user = get_user_by_username(username)
    if user is None:
        raise UserNotFoundError
    _ensure_user_can_manage_favorites(user)

    favorite_job_ids = user.favorite_jobs or []
    return [
        job for job in database.session.query(JobsMdl).filter(JobsMdl.id.in_([uuid.UUID(value) for value in favorite_job_ids])).all()
    ]
