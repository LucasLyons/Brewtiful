import lightfm
import optuna
from lightfm import data, LightFM
from lightfm.evaluation import precision_at_k
import numpy as np

def construct_item_features(light_data, dataset, b=.2, s=.1):
    # Create item features with weighted brewery and style
    return light_data.build_item_features(
        (beer_id, {f'{brewery}': b, f'{style}': s})
        for beer_id, brewery, style in zip(
            dataset['beer_id'], 
            dataset['brewery'], 
            dataset['style']
            )
        )

def objective_custom(trial, train_interactions=None, val_interactions=None,
                     random_state=123, p_k=10, sample_weight=None, use_item_features=False, loss=["bpr", "warp", "warp-kos", "logistic"],
                     light_data=None, dataset=None, enable_pruning=True, pruning_interval=5):
    """
    Customizable objective function for Optuna hyperparameter optimization of LightFM model.
    Args:
        trial (optuna.trial.Trial): An Optuna trial object.
        train_interactions (scipy.sparse.csr.csr_matrix): Training interaction matrix.
        val_interactions (scipy.sparse.csr.csr_matrix): Validation interaction matrix.
        random_state (int): Random seed for reproducibility.
        p_k (int): The number of top items to consider for precision@k evaluation.
        sample_weight (array-like, optional): Sample weights for training interactions.
        use_item_features (bool): Whether to use item features in the model.
        loss (list): List of LightFM loss functions to choose from.
        enable_pruning (bool): Whether to enable trial pruning based on intermediate values.
        pruning_interval (int): Evaluate and report metrics every N epochs for pruning.
    """

    # Define the base hyperparameter space
    param = {
        'no_components': trial.suggest_int("no_components", 5, 128),
        "learning_schedule": trial.suggest_categorical("learning_schedule", ["adagrad", "adadelta"]),
        "loss": trial.suggest_categorical("loss", loss),
        "item_alpha": trial.suggest_float("item_alpha", 1e-10, 1e-06, log=True),
        "user_alpha": trial.suggest_float("user_alpha", 1e-10, 1e-06, log=True),
    }

    # Conditionally suggest learning schedule specific parameters
    if param["learning_schedule"] == "adagrad":
        param["learning_rate"] = trial.suggest_float("learning_rate", 0.001, 1, log=True)
    elif param["learning_schedule"] == "adadelta":
        param["rho"] = trial.suggest_float("rho", 0.9, 0.999) # Typical range for rho
        param["epsilon"] = trial.suggest_float("epsilon", 1e-08, 1e-06, log=True) # Typical range for epsilon

    weight = True

    # Conditionally suggest loss function specific parameters
    if param["loss"] == "warp":
        param["max_sampled"] = trial.suggest_int("max_sampled", 5, 15)
    elif param["loss"] == "warp-kos":
        param["max_sampled"] = trial.suggest_int("max_sampled", 5, 15)
        # k should be less than or equal to n, so suggest k first, then n based on k
        param["k"] = trial.suggest_int("k", 1, 10)
        param["n"] = trial.suggest_int("n", param["k"], 20) # n must be >= k
        weight = False

    epochs = trial.suggest_int("epochs", 20, 50)

    # Initialize LightFM model with the chosen parameters
    model = LightFM(**param, random_state=random_state)

    # Prepare fit parameters (excluding epochs for manual loop)
    fit_params = {
        'verbose': False,  # Disable verbose for epoch-by-epoch training
    }

    if weight:
        fit_params['sample_weight'] = sample_weight
    if use_item_features:
        b = trial.suggest_float("b", 0, 0.5)
        s = trial.suggest_float("s", 0, 0.5)
        features = construct_item_features(light_data, dataset, b, s)
        fit_params['item_features'] = features
    else:
        fit_params['item_features'] = None

    # Train epoch-by-epoch to enable pruning
    if enable_pruning:
        for epoch in range(epochs):
            model.fit_partial(train_interactions, **fit_params)

            # Evaluate every pruning_interval epochs
            if (epoch + 1) % pruning_interval == 0 or epoch == epochs - 1:
                val_precision = precision_at_k(model,
                                            test_interactions=val_interactions,
                                            train_interactions=train_interactions,
                                            item_features=fit_params['item_features'],
                                            k=p_k).mean()

                # Report intermediate value
                trial.report(val_precision, epoch)

                # Check if trial should be pruned
                if trial.should_prune():
                    raise optuna.TrialPruned()

        return val_precision
    else:
        # Original batch training without pruning
        fit_params['epochs'] = epochs
        fit_params['verbose'] = True
        model.fit(train_interactions, **fit_params)

        val_precision = precision_at_k(model,
                                    test_interactions=val_interactions,
                                    train_interactions=train_interactions,
                                    item_features=fit_params['item_features'],
                                    k=p_k).mean()

        return val_precision
    
def create_objective(**model_params):
    """
    Customizable objective function for Optuna hyperparameter optimization of LightFM model.
    Args:
        trial (optuna.trial.Trial): An Optuna trial object.
        train_interactions (scipy.sparse.csr.csr_matrix): Training interaction matrix.
        val_interactions (scipy.sparse.csr.csr_matrix): Validation interaction matrix.
        random_state (int): Random seed for reproducibility.
        p_k (int): The number of top items to consider for precision@k evaluation.
        sample_weight (array-like, optional): Sample weights for training interactions.
        use_item_features (bool): Whether to use item features in the model.
        loss (list): List of LightFM loss functions to choose from.
        enable_pruning (bool): Whether to enable trial pruning based on intermediate values.
        pruning_interval (int): Evaluate and report metrics every N epochs for pruning.
    """
    def wrapped_objective(trial):
        return objective_custom(trial, **model_params)
    return wrapped_objective