"""Transpiler from Recall DSL to Qdrant filter syntax."""

from qdrant_client.models import (
    FieldCondition,
    Filter,
    MatchAny,
    MatchValue,
    Range,
)

from recall.models.search import (
    AndFilter,
    EqCondition,
    FilterCondition,
    GtCondition,
    GteCondition,
    InCondition,
    LtCondition,
    LteCondition,
    NeqCondition,
    OrFilter,
)


class QdrantTranspiler:
    """Transpiles Recall DSL filters to Qdrant Filter objects."""

    @classmethod
    def transpile(cls, dsl: FilterCondition | None) -> Filter | None:
        """Convert DSL filter to Qdrant Filter.

        Args:
            dsl: Recall DSL filter condition

        Returns:
            Qdrant Filter object or None
        """
        if dsl is None:
            return None
        return cls._transpile_condition(dsl)

    @classmethod
    def _transpile_condition(cls, condition: FilterCondition) -> Filter:
        match condition.op:
            case "EQ":
                return cls._transpile_eq(condition)
            case "NEQ":
                return cls._transpile_neq(condition)
            case "LT":
                return cls._transpile_lt(condition)
            case "LTE":
                return cls._transpile_lte(condition)
            case "GT":
                return cls._transpile_gt(condition)
            case "GTE":
                return cls._transpile_gte(condition)
            case "IN":
                return cls._transpile_in(condition)
            case "AND":
                return cls._transpile_and(condition)
            case "OR":
                return cls._transpile_or(condition)
            case _:
                raise ValueError(f"Unknown operation: {condition.op}")

    @classmethod
    def _transpile_eq(cls, condition: EqCondition) -> Filter:
        return Filter(
            must=[
                FieldCondition(
                    key=condition.field,
                    match=MatchValue(value=condition.value),
                )
            ]
        )

    @classmethod
    def _transpile_neq(cls, condition: NeqCondition) -> Filter:
        return Filter(
            must_not=[
                FieldCondition(
                    key=condition.field,
                    match=MatchValue(value=condition.value),
                )
            ]
        )

    @classmethod
    def _transpile_lt(cls, condition: LtCondition) -> Filter:
        return Filter(
            must=[
                FieldCondition(
                    key=condition.field,
                    range=Range(lt=condition.value),
                )
            ]
        )

    @classmethod
    def _transpile_lte(cls, condition: LteCondition) -> Filter:
        return Filter(
            must=[
                FieldCondition(
                    key=condition.field,
                    range=Range(lte=condition.value),
                )
            ]
        )

    @classmethod
    def _transpile_gt(cls, condition: GtCondition) -> Filter:
        return Filter(
            must=[
                FieldCondition(
                    key=condition.field,
                    range=Range(gt=condition.value),
                )
            ]
        )

    @classmethod
    def _transpile_gte(cls, condition: GteCondition) -> Filter:
        return Filter(
            must=[
                FieldCondition(
                    key=condition.field,
                    range=Range(gte=condition.value),
                )
            ]
        )

    @classmethod
    def _transpile_in(cls, condition: InCondition) -> Filter:
        return Filter(
            must=[
                FieldCondition(
                    key=condition.field,
                    match=MatchAny(any=condition.value),
                )
            ]
        )

    @classmethod
    def _transpile_and(cls, condition: AndFilter) -> Filter:
        must_conditions: list[FieldCondition] = []
        must_not_conditions: list[FieldCondition] = []

        for sub in condition.conditions:
            sub_filter = cls._transpile_condition(sub)
            if sub_filter.must:
                must_conditions.extend(sub_filter.must)
            if sub_filter.must_not:
                must_not_conditions.extend(sub_filter.must_not)

        return Filter(
            must=must_conditions if must_conditions else None,
            must_not=must_not_conditions if must_not_conditions else None,
        )

    @classmethod
    def _transpile_or(cls, condition: OrFilter) -> Filter:
        should_filters: list[Filter] = []

        for sub in condition.conditions:
            should_filters.append(cls._transpile_condition(sub))

        return Filter(should=should_filters)
