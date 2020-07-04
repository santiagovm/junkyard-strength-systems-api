import { dropUser, findUserByEmail, insertUser } from '../models/userModel.js';
import {
    onBadRequest,
    onConflict,
    onCreated,
    onError,
    onSuccessWithPayload,
    onUnauthorized
} from '../helpers/responseHelper.js';
import { generateSaltHash, getJWT, validatePassword } from '../helpers/authHelper.js';

export async function registerUser(req, res) {
    const isUserRegistered = await findUserByEmail(req.body.email);

    if (isUserRegistered) {
        return onConflict(res, 'email is already associated with an account');
    } else {
        const { salt, saltHash } = generateSaltHash(req.body.password);

        req.body.password = saltHash;
        req.body.salt = salt;

        try {
            const document = await insertUser(req.body);

            return onCreated(res, 'success', { id: document._id });
        } catch (error) {
            return onBadRequest;
        }
    }
}

export async function logInUser(req, res) {
    const user = await findUserByEmail(req.body.email);

    if (!user) {
        return onUnauthorized(res, 'auth failed');
    } else {
        const isPasswordValid = validatePassword(user, req);

        if (!isPasswordValid) {
            return onUnauthorized(res, 'auth failed');
        } else {
            try {
                const token = getJWT(user._id, user.email);
                return onSuccessWithPayload(res, token, 'auth succeeded');
            } catch (error) {
                return onError(res, error);
            }
        }
    }
}

export async function deleteUser(req, res) {
    try {
        const droppedUser = await dropUser({ _id: req.params.id });
        return onSuccessWithPayload(res, droppedUser, 'user deleted');
    } catch (error) {
        return onError(res, error);
    }
}
