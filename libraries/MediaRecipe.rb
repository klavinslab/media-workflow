# frozen_string_literal: true

class Measure
  include Comparable

  attr_reader :amount, :unit

  def initialize(amount:, unit:)
    @amount = amount
    @unit = unit
  end

  def <=>(other)
    if @unit == other.unit
      if @amount < other.amount
        -1
      elsif @amount > other.amount
        1
      else
        0
      end
    else 
      @unit <=> other.unit
    end
  end

  def to_s
    "#{amount} #{unit}"
  end
end

class Ingredient
  attr_reader :name, :amount, :directions, :unit

  def initialize(name:, amount:, unit:, directions:)
    @name = name
    @amount = amount
    @unit = unit
    @directions = directions
  end
end

class Media
  attr_reader :sample_name, :bottle, :volume, :unit, :type, :output
  attr_accessor :count

  def initialize(sample_name:, bottle:, volume:, unit:, type:, count:, output:)
    @sample_name = sample_name
    @bottle = bottle
    @volume = volume
    @unit = unit
    @type = type
    @count = count
    @output = output
  end
end

class Recipe
  attr_reader :ingredients

  def initialize
    @ingredients = []
  end

  def add(ingredient:)
    @ingredients.push(ingredient)
  end
end
