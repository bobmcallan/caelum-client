const _measureDefinition = (input) => {

        if (!input || !_.isString(input) || _.isEmpty(input)) return input

        const _input = input.split('.')
        const _output = {
            division: _input[0],
            purchase_type: _input[1],
            cohort: _input[2],
            measure: _input[3],
            field: (_input.length > 3) ? _input[4] : null,
            divisionCount: selectedDivisions.value.length,
            cohortCount: selectedCohorts.value.length,
            purchaseTypeCount: selectedPurchaseTypes.value.length,
        }

        const outputPart1 = []
        const outputPart2 = []

        logger.trace('[measureName] output:%s', toJson(_output));

        // Measure
        // _output.measure = common.measureName(_output.measure)
        _output.measure_name = common.measureName(_output.measure)

        // Field
        _output.field = common.measureName(_output.field)

        // Divisions
        _output.division = common.divisionName(_output.division)

        // Purchase Types
        _output.purchase_type = common.purchaseTypeName(_output.purchase_type)

        // Cohorts
        _output.cohort = common.cohortName(_output.cohort)

        // Assemble
        outputPart1.push(_output.measure_name)
        if (_output.field) outputPart1.push(_output.field)

        outputPart2.push(_output.division)
        outputPart2.push(_output.purchase_type)
        if (_output.cohort && _output.cohort.toLowerCase() != 'all') outputPart2.push(_output.cohort)

        const measureColor = () => {
            if (_output.field != null) return common.measureColor(_output.field)

            const dColor = common.divisionColor(_output.division) ?? randomColor();
            const pColor = common.purchaseTypeColor(_output.purchase_type) ?? randomColor();
            const cColor = common.cohortColor(_output.cohort) ?? randomColor();
            const mColor = common.measureColor(_output.measure) ?? randomColor();

            logger.trace('[measureColor] color inputs:%s', toJson({ division: _output.division, purchase_type: _output.purchase_type, cohort: _output.cohort, measure: _output.measure }));
            logger.trace('[measureColor] outputs colors:%s', toJson({ dColor: dColor, pColor: pColor, cColor: cColor, mColor: mColor }));

            // Single Division
            if (_output.divisionCount <= 1) {

                // Single Cohort && Single Purchase Type
                if (_output.cohortCount <= 1 && _output.purchaseTypeCount <= 1) return mColor

                // Single Cohort && Multiple PurchaseType
                if (_output.cohortCount <= 1 && _output.purchaseTypeCount > 1) return chroma.average([mColor, pColor], 'rgb', [10, 5, 1]).hex();

                // Mulitple Cohort
                if (_output.cohortCount > 1) return chroma.average([cColor, pColor, mColor], 'rgb', [10, 5, 1]).hex();

                // Weighted Cohort Color
                return chroma.average([cColor, pColor, dColor], 'rgb', [10, 5, 1]).hex();

            }

            // Multiple Division
            if (_output.divisionCount > 1) {

                logger.trace('[measureColor] output:%s', toJson(_output));

                // Go by Division color
                if (_output.cohortCount <= 1 && _output.purchaseTypeCount <= 1) return dColor;

                // Weighted Division Color
                if (_output.cohortCount <= 1 && _output.purchaseTypeCount > 1) return chroma.average([dColor, pColor], 'rgb', [10, 5]).hex();

                // Weighted Division Color
                return chroma.average([dColor, cColor, pColor], 'rgb', [10, 5, 1]).hex();
            }

            // Should not get here, but!
            return chroma.random().hex();

        }

        const measureSymbol = () => {

            if (!_output.purchase_type || _.isNull(_output.purchase_type)) return null

            switch (_output.purchase_type.toLowerCase()) {
                case 'instore':
                    return 'triangle'
                case 'c&c':
                    return 'rect'
                default:
                    return null
            }

        }

        return {
            key: input,
            measure: _output.measure,
            name: `${outputPart1.join('/')} - ${outputPart2.join('/')}`,
            color: measureColor(),
            symbol: measureSymbol()
        }
    }