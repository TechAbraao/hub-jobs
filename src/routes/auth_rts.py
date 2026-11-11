import uuid

from flask import Blueprint, current_app, jsonify, request
from marshmallow import RAISE, Schema, ValidationError, fields, validate

from src.controllers import auth_ctr
from src.schemas.http import validation_details
import logging

logging.basicConfig(level=logging.INFO)
auth_rts = Blueprint("auth_rts", __name__, url_prefix="/auth")


class RegisterUserSchema(Schema):
    class Meta:
        unknown = RAISE

    username = fields.String(required=True, validate=validate.Length(min=3, max=80))
    password = fields.String(required=True, validate=validate.Length(min=3, max=255))
    role = fields.String(load_default="user", validate=validate.OneOf(["user", "admin"]))


class LoginUserSchema(Schema):
    class Meta:
        unknown = RAISE

    username = fields.String(required=True, validate=validate.Length(min=3, max=80))
    password = fields.String(required=True, validate=validate.Length(min=3, max=255))


class FavoriteSchema(Schema):
    class Meta:
        unknown = RAISE

    username = fields.String(required=True, validate=validate.Length(min=3, max=80))
    job_id = fields.String(required=True)


class UpdateUserProfileSchema(Schema):
    class Meta:
        unknown = RAISE

    username = fields.String(load_default=None, allow_none=True, validate=validate.Length(min=3, max=80))
    password = fields.String(load_default=None, allow_none=True, validate=validate.Length(min=3, max=255))
    current_username = fields.String(load_default=None, allow_none=True, validate=validate.Length(min=3, max=80))
    current_password = fields.String(load_default=None, allow_none=True, validate=validate.Length(min=3, max=255))

class UpdateUserIsActiveSchema(Schema):
    class Meta:
        unknown = RAISE
    is_active = fields.Boolean(required=True)

def _error(message: str, status: int, details: object | None = None):
    body: dict[str, object] = {"error": message}
    if details is not None:
        body["details"] = details
    return jsonify(body), status


def _json_body() -> dict[str, object] | None:
    body = request.get_json(silent=True)
    return body if isinstance(body, dict) else None


@auth_rts.route("/register", methods=["POST"])
def register_user():
    body = _json_body()
    if body is None:
        return _error("O corpo da requisição deve ser um objeto JSON.", 400)
    try:
        data = RegisterUserSchema().load(body)
        user = auth_ctr.create_user(data["username"], data["password"], role=data.get("role", "user"))
    except ValidationError as error:
        return _error("Dados inválidos.", 400, validation_details(error))
    except auth_ctr.DuplicateUserError:
        return _error("Este usuário já existe.", 409)
    except ValueError as error:
        return _error(str(error), 400)
    except Exception:
        current_app.logger.exception("Failed to register user")
        return _error("Não foi possível cadastrar o usuário.", 500)
    return jsonify({"user": user.to_dict()}), 201


@auth_rts.route("/login", methods=["POST"])
def login_user():
    body = _json_body()
    if body is None:
        return _error("O corpo da requisição deve ser um objeto JSON.", 400)
    try:
        data = LoginUserSchema().load(body)
        user = auth_ctr.authenticate_user(data["username"], data["password"])

        # logging.info(f"User is_active: {user.is_active} and type {type(user.is_active)}")
        
        if user.is_active == "deactivated" or user.is_active == "false":
            return _error("Usuário inativo. Contate o administrador.", 403)

    except ValidationError as error:
        return _error("Dados inválidos.", 400, validation_details(error))
    except auth_ctr.InvalidCredentialsError:
        return _error("Credenciais inválidas.", 401)
    except Exception:
        current_app.logger.exception("Failed to login user")
        return _error("Não foi possível autenticar o usuário.", 500)
    return jsonify({"user": user.to_dict()}), 200


@auth_rts.route("/users", methods=["GET"])
def list_users():
    try:
        page = int(request.args.get("page", "1"))
        per_page = int(request.args.get("per_page", "10"))
    except ValueError:
        return _error("page e per_page devem ser números válidos.", 400)

    if page < 1 or per_page < 1 or per_page > 100:
        return _error("page deve ser >= 1 e per_page deve estar entre 1 e 100.", 400)

    query = request.args.get("q")
    try:
        users = auth_ctr.list_users()
        if query:
            term = query.strip().lower()
            users = [user for user in users if term in (user.username or "").lower()]
        total = len(users)
        start = (page - 1) * per_page
        paginated = users[start:start + per_page]
    except Exception:
        current_app.logger.exception("Failed to list users")
        return _error("Não foi possível consultar os usuários.", 500)

    serialized_users = []
    for user in paginated:
        favorite_jobs = list(user.favorite_jobs or []) if user.role != "admin" else []
        serialized_users.append({
            "id": str(user.id),
            "username": user.username,
            "role": user.role,
            "favorite_jobs": [str(job_id) for job_id in favorite_jobs],
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        })

    from math import ceil
    return jsonify({
        "users": serialized_users,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "pages": ceil(total / per_page) if total else 1,
        },
    }), 200


@auth_rts.route("/users/<user_id>", methods=["PATCH", "PUT"])
@auth_rts.route("/users/<user_id>/profile", methods=["PATCH", "PUT"])
def update_user_profile_route(user_id: str):
    body = _json_body()
    if body is None:
        return _error("O corpo da requisição deve ser um objeto JSON.", 400)

    try:
        parsed_user_id = uuid.UUID(str(user_id))
    except (ValueError, TypeError):
        return _error("user_id deve ser um UUID válido.", 400)

    try:
        data = UpdateUserProfileSchema().load(body)
        if data.get("username") is None and data.get("password") is None:
            return _error("Informe ao menos um campo para atualizar: username ou password.", 400)
        updated = auth_ctr.update_user_profile(
            parsed_user_id,
            new_username=data.get("username"),
            current_username=data.get("current_username"),
            new_password=data.get("password"),
            current_password=data.get("current_password"),
        )
    except ValidationError as error:
        return _error("Dados inválidos.", 400, validation_details(error))
    except auth_ctr.UserNotFoundError:
        return _error("Usuário não encontrado.", 404)
    except auth_ctr.DuplicateUserError:
        return _error("Este usuário já existe.", 409)
    except ValueError as error:
        return _error(str(error), 400)
    except Exception:
        current_app.logger.exception("Failed to update user profile")
        return _error("Não foi possível atualizar o usuário.", 500)

    return jsonify({"message": "Usuário atualizado com sucesso.", "user": updated.to_dict()}), 200


@auth_rts.route("/users/<user_id>/status", methods=["PUT"])
def update_user_is_active_route(user_id: str):
    body = _json_body()
    if body is None:
        return _error("O corpo da requisição deve ser um objeto JSON.", 400)

    try:
        parsed_user_id = uuid.UUID(str(user_id))
    except (ValueError, TypeError):
        return _error("user_id deve ser um UUID válido.", 400)

    try:
        data = UpdateUserIsActiveSchema().load(body)
        updated = auth_ctr.update_user_is_active(
            parsed_user_id,
            is_active=data.get("is_active")
        )
    except ValidationError as error:
        return _error("Dados inválidos.", 400, validation_details(error))
    except auth_ctr.UserNotFoundError:
        return _error("Usuário não encontrado.", 404)
    except ValueError as error:
        return _error(str(error), 400)
    except Exception:
        current_app.logger.exception("Failed to update user is_active")
        return _error("Não foi possível atualizar o status do usuário.", 500)

    return jsonify({"message": "Status do usuário atualizado com sucesso.", "user": updated.to_dict()}), 200


@auth_rts.route("/users/<user_id>", methods=["DELETE"])
def delete_user_route(user_id: str):
    try:
        parsed_user_id = uuid.UUID(str(user_id))
    except ValueError:
        return _error("user_id deve ser um UUID válido.", 400)

    try:
        deleted = auth_ctr.delete_user_by_id(parsed_user_id)
    except auth_ctr.UserNotFoundError:
        return _error("Usuário não encontrado.", 404)
    except ValueError as error:
        return _error(str(error), 403 if "admin" in str(error).lower() else 400)
    except Exception:
        current_app.logger.exception("Failed to delete user")
        return _error("Não foi possível remover o usuário.", 500)

    return jsonify({"message": "Usuário removido com sucesso.", "user": deleted.to_dict()}), 200


@auth_rts.route("/favorites", methods=["GET"])
def list_favorites():
    username = request.args.get("username")
    if not username:
        return _error("Parâmetro 'username' é obrigatório.", 400)
    try:
        jobs = auth_ctr.list_favorite_jobs(username)
    except auth_ctr.UserNotFoundError:
        return _error("Usuário não encontrado.", 404)
    except ValueError as error:
        return _error(str(error), 403)
    except Exception:
        current_app.logger.exception("Failed to list favorites")
        return _error("Não foi possível consultar os favoritos.", 500)
    return jsonify({"favorite_jobs": [job.to_dict() for job in jobs]}), 200

@auth_rts.route("/favorites", methods=["POST", "DELETE"])
def manage_favorites():
    body = _json_body()

    if body is None:
        return _error("O corpo da requisição deve ser um objeto JSON.", 400)

    try:
        data = FavoriteSchema().load(body)
    except ValidationError as error:
        return _error("Dados inválidos.", 400, validation_details(error))
    
    user_name = data["username"]
    job_id = data["job_id"]

    try:
        if request.method == "POST":
            user = auth_ctr.add_favorite_job(user_name, job_id)
            return jsonify({"message": "Vaga adicionada aos favoritos.", "user": user.to_dict()}), 200

        # Aqui é o fluxo request.method == "DELETE"
        user = auth_ctr.remove_favorite_job(user_name, job_id)
        return jsonify({"message": "Vaga removida dos favoritos.", "user": user.to_dict()}), 200
    except auth_ctr.UserNotFoundError:
        return _error("Usuário não encontrado.", 404)
    except ValueError as error:
        message = str(error)
        if "job not found" in message.lower():
            return _error(message, 404)
        if "favoritos" in message.lower() or "admin" in message.lower():
            return _error(message, 403)
        return _error(message, 400)
    except Exception:
        current_app.logger.exception("Failed to update favorites")
        return _error("Não foi possível atualizar os favoritos.", 500)
